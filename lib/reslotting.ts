import type { SkuRow, AbcClass } from "./inventory-data"

// ---------------------------------------------------------------------------
// Cross-ABC slotting engine
//
// 기존 ABC는 "물량(dailyOutflow)" 단일 축이었다. 4-Way 셔틀에서 실제 피킹
// 효율을 결정하는 건 "얼마나 자주 집느냐(빈도, dailyPickFreq)"이기도 하다.
// 그래서 두 축을 교차(Cross-ABC)해서 최종 슬롯 깊이를 정한다.
//
//   물량축(Volume) : 하루 출고 수량      -> A / B / C
//   빈도축(Freq)   : 하루 피킹 횟수      -> A / B / C
//
// 원칙: "자주 집는 물건일수록 얕게(1-Deep 쪽) 둔다." 빈도가 물량을 이긴다.
// 다만 규칙은 블랙박스가 아니라 명시적 예외 룰로만 승급/강등한다.
// ---------------------------------------------------------------------------

export type Axis = "A" | "B" | "C"

// 조정 가능한 임계값 (룰 설정 화면에서 바꿀 수 있음)
export type SlottingThresholds = {
  // 물량축 (EA/day)
  volumeA: number
  volumeB: number
  // 빈도축 (picks/day)
  freqA: number
  freqB: number
  // 리슬롯팅 플래그 임계: |현재 depth - 권장 depth| 이 값 이상일 때만 후보로 올림
  // (값을 키우면 잦은 소폭 이동을 억제 = 과도한 재배치 방지)
  minDepthGap: number
}

export const DEFAULT_THRESHOLDS: SlottingThresholds = {
  volumeA: 120,
  volumeB: 45,
  freqA: 35,
  freqB: 15,
  minDepthGap: 1,
}

export function volumeAxis(row: SkuRow, t: SlottingThresholds): Axis {
  if (row.dailyOutflow >= t.volumeA) return "A"
  if (row.dailyOutflow >= t.volumeB) return "B"
  return "C"
}

export function freqAxis(row: SkuRow, t: SlottingThresholds): Axis {
  if (row.dailyPickFreq >= t.freqA) return "A"
  if (row.dailyPickFreq >= t.freqB) return "B"
  return "C"
}

// 슬롯 등급을 depth 대역으로 표현 (얕을수록 빠른 피킹)
export type SlotGrade = "S" | "A" | "B" | "C"

// 등급 -> 목표 depth (4-Way 셔틀 레인 깊이)
export const GRADE_TARGET_DEPTH: Record<SlotGrade, number> = {
  S: 1, // 초고빈도 최전면
  A: 2,
  B: 3,
  C: 5,
}

export const GRADE_DEPTH_LABEL: Record<SlotGrade, string> = {
  S: "1-Deep",
  A: "1–2 Deep",
  B: "3 Deep",
  C: "4–5 Deep",
}

// Cross-ABC 기본 매트릭스: (물량축, 빈도축) -> 기본 등급
// 행 = 물량, 열 = 빈도
const BASE_MATRIX: Record<Axis, Record<Axis, SlotGrade>> = {
  A: { A: "S", B: "A", C: "B" },
  B: { A: "A", B: "B", C: "C" },
  C: { A: "B", B: "C", C: "C" },
}

export type AppliedRule = {
  id: string
  label: string
  effect: string
}

export type GradeResult = {
  volume: Axis
  freq: Axis
  baseGrade: SlotGrade
  finalGrade: SlotGrade
  targetDepth: number
  appliedRules: AppliedRule[]
}

const GRADE_ORDER: SlotGrade[] = ["C", "B", "A", "S"]

function promote(grade: SlotGrade, steps: number): SlotGrade {
  const i = GRADE_ORDER.indexOf(grade)
  return GRADE_ORDER[Math.min(GRADE_ORDER.length - 1, i + steps)]
}

// 명시적 예외 룰 엔진. 룰은 순서대로 평가되며 각 룰이 왜 적용됐는지 기록된다.
export function classifySlot(
  row: SkuRow,
  t: SlottingThresholds = DEFAULT_THRESHOLDS,
): GradeResult {
  const volume = volumeAxis(row, t)
  const freq = freqAxis(row, t)
  const baseGrade = BASE_MATRIX[volume][freq]

  const appliedRules: AppliedRule[] = []
  let finalGrade = baseGrade

  // 룰 1) 물량 C + 빈도 A: 소량이지만 매우 자주 집힌다 -> A(1–2 Deep) 전면 승급.
  // (빈도가 물량을 이긴다. 룰 2와 중복 승급하지 않도록 여기서 확정한다.)
  const r1Applied = volume === "C" && freq === "A"
  if (r1Applied) {
    finalGrade = "A"
    appliedRules.push({
      id: "R1-lowvol-highfreq",
      label: "물량C · 빈도A 전면 승급",
      effect: "소량 다빈도 → 1–2 Deep 전면 배치",
    })
  }

  // 룰 2) 빈도 A인데 기본 등급이 B 이하 -> 한 단계 승급(자주 집는 건 얕게).
  // 룰 1이 이미 확정한 경우엔 적용하지 않는다(중복 승급 방지).
  if (!r1Applied && freq === "A" && (baseGrade === "B" || baseGrade === "C")) {
    const bumped = promote(finalGrade, 1)
    if (bumped !== finalGrade) {
      finalGrade = bumped
      appliedRules.push({
        id: "R2-freq-priority",
        label: "빈도 우선 승급",
        effect: "빈도A → 한 단계 얕은 레인으로",
      })
    }
  }

  // 룰 3) 물량 A + 빈도 C: 대량이지만 몰아서 집는다 -> B(3 Deep)로 강등해 밀도 확보.
  // 물량이 많아도 자주 집지 않으면 전면 자리를 양보한다(정상 케이스, 경고 아님).
  if (volume === "A" && freq === "C") {
    finalGrade = "B"
    appliedRules.push({
      id: "R3-highvol-lowfreq",
      label: "물량A · 빈도C 밀도 강등",
      effect: "대량 배치출고 → 3 Deep 고밀도 저장",
    })
  }

  return {
    volume,
    freq,
    baseGrade,
    finalGrade,
    targetDepth: GRADE_TARGET_DEPTH[finalGrade],
    appliedRules,
  }
}

// ---------------------------------------------------------------------------
// 이동 비용 기반 리슬롯팅 판단
//
// 개선폭(예: 5-Deep→1-Deep)만으로는 부족하다. 실제 이동에는 비용이 든다:
//  - 옮길 팔레트 + 앞을 막고 있어 재취급해야 하는 팔레트를 다 빼냈다 넣는다
//  - 셔틀 취급·주행 시간, 레벨 이동 시 리프트 시간
//  - 이동 중 해당 레인의 피킹이 멈추는 손실
// 이 비용을 계산해 "순이득이 나는 건"만 추천한다.
// 모든 파라미터는 룰 설정 화면의 슬라이더로 노출되어 즉시 재계산된다.
// ---------------------------------------------------------------------------

export type MoveCostParams = {
  palletCapacity: number // 팔레트당 적재량 (EA/pallet)
  shuttleHandleSec: number // 셔틀 취급시간 (팔레트 1개 집고 놓기, 초)
  travelSecPerDepth: number // 깊이 1칸 주행시간 (초)
  liftSec: number // 레벨 1칸 리프트 시간 (초)
  laneBlockLossFactor: number // 레인 차단 손실 계수 (이동 중 피킹정지 가중)
  gradeValidityDays: number // 등급 유효기간 (이득 회수 기간, 일)
  paybackThresholdDays: number // Payback 임계 (이 이하면 추천)
}

export const DEFAULT_MOVE_PARAMS: MoveCostParams = {
  palletCapacity: 48,
  shuttleHandleSec: 40,
  travelSecPerDepth: 12,
  liftSec: 25,
  laneBlockLossFactor: 0.6,
  gradeValidityDays: 14,
  paybackThresholdDays: 10,
}

export type MoveVerdict = "recommend" | "review" | "reject"

export const VERDICT_LABEL: Record<MoveVerdict, string> = {
  recommend: "추천",
  review: "검토필요",
  reject: "기각",
}

export type MoveBreakdown = {
  handleSec: number // 셔틀 취급
  shuttleSec: number // 주행(깊이 + 통로 이동)
  liftSec: number // 리프트(레벨 이동)
  blockLossSec: number // 레인 차단 손실
}

export type MoveOption = {
  id: "depth" | "vertical" | "horizontal"
  label: string
  desc: string
  fromLabel: string
  toLabel: string
  movePallets: number // 옮길 팔레트 수
  rehandlePallets: number // 앞을 막아 재취급하는 팔레트 수
  totalMoveSec: number // 총 소요시간(초)
  breakdown: MoveBreakdown
  dailySavedSec: number // 일일 절감(초/일)
  paybackDays: number // 회수 일수
  netGainSec: number // 등급 유효기간 동안의 순이득(초)
  verdict: MoveVerdict
  feasible: boolean // 이동 대상이 실제로 존재하는지 (이미 골든존이면 false 등)
}

const GOLDEN_LEVEL = 3 // 중단(허리 높이) 골든존 레벨
const AISLE_CROSS_MULT = 3 // 통로 횡단은 깊이 1칸 주행의 몇 배인지
const LEVEL_PENALTY_MULT = 0.25 // 골든존 이탈 시 피킹당 리프트/리치 패널티 비중
const CURRENT_AISLE_FACTOR = 2 // 현재 통로의 접근 페널티(프라임 통로=0 기준)

function verdictFor(
  dailySavedSec: number,
  netGainSec: number,
  paybackDays: number,
  p: MoveCostParams,
): MoveVerdict {
  if (dailySavedSec <= 0 || netGainSec <= 0 || !isFinite(paybackDays)) return "reject"
  if (paybackDays <= p.paybackThresholdDays) return "recommend"
  return "review"
}

function buildOption(
  id: MoveOption["id"],
  label: string,
  desc: string,
  row: SkuRow,
  p: MoveCostParams,
  o: {
    fromLabel: string
    toLabel: string
    savedPerPick: number // 피킹 1회당 접근시간 단축분(초)
    depthTravel: number // 셔틀 깊이 왕복 칸수
    levelsMoved: number // 리프트 레벨 이동 수
    aisleCross: number // 통로 횡단 횟수
    feasible: boolean
  },
): MoveOption {
  const movePallets = Math.max(1, Math.ceil(row.inventory / p.palletCapacity))
  const rehandlePallets = Math.max(0, row.location.depth - 1) // 앞을 막고 있는 팔레트
  const units = movePallets + rehandlePallets

  const handleSec = units * p.shuttleHandleSec
  const shuttleSec =
    units * o.depthTravel * p.travelSecPerDepth +
    o.aisleCross * movePallets * p.travelSecPerDepth * AISLE_CROSS_MULT
  const liftSec = movePallets * o.levelsMoved * p.liftSec
  const activeSec = handleSec + shuttleSec + liftSec
  const blockLossSec = activeSec * p.laneBlockLossFactor // 이동 중 레인 피킹 정지 손실
  const totalMoveSec = activeSec + blockLossSec

  const dailySavedSec = Math.max(0, o.savedPerPick) * row.dailyPickFreq
  const paybackDays = dailySavedSec > 0 ? totalMoveSec / dailySavedSec : Infinity
  const netGainSec = dailySavedSec * p.gradeValidityDays - totalMoveSec
  const verdict = o.feasible ? verdictFor(dailySavedSec, netGainSec, paybackDays, p) : "reject"

  return {
    id,
    label,
    desc,
    fromLabel: o.fromLabel,
    toLabel: o.toLabel,
    movePallets,
    rehandlePallets,
    totalMoveSec,
    breakdown: { handleSec, shuttleSec, liftSec, blockLossSec },
    dailySavedSec,
    paybackDays,
    netGainSec,
    verdict,
    feasible: o.feasible,
  }
}

// SKU마다 3가지 재배치 대안을 모두 계산한다 (4방향 셔틀 특성).
//  ① 같은 레인에서 깊이만 조정
//  ② 같은 통로에서 골든존(중단 레벨)으로 상하 이동
//  ③ 회전율 높은 인접 통로로 수평 이동
export function computeMoveOptions(
  row: SkuRow,
  grade: GradeResult,
  p: MoveCostParams = DEFAULT_MOVE_PARAMS,
): MoveOption[] {
  const curDepth = row.location.depth
  const curLevel = row.location.level
  const targetDepth = grade.targetDepth

  const depthImprovement = curDepth - targetDepth // 양수 = 얕아짐(개선)
  const depthOption = buildOption("depth", "① 깊이 조정", "같은 레인에서 Depth만 조정", row, p, {
    fromLabel: `${curDepth}-Deep`,
    toLabel: `${targetDepth}-Deep`,
    savedPerPick: depthImprovement * p.travelSecPerDepth,
    depthTravel: Math.abs(curDepth - targetDepth),
    levelsMoved: 0,
    aisleCross: 0,
    feasible: curDepth !== targetDepth,
  })

  const levelsToGolden = Math.abs(curLevel - GOLDEN_LEVEL)
  const verticalOption = buildOption(
    "vertical",
    "② 골든존 이동",
    "같은 통로에서 중단 레벨(골든존)로 상하 이동",
    row,
    p,
    {
      fromLabel: `L${curLevel}`,
      toLabel: `L${GOLDEN_LEVEL} 골든존`,
      savedPerPick: levelsToGolden * p.liftSec * LEVEL_PENALTY_MULT,
      depthTravel: curDepth, // 레인에서 완전히 빼냈다 다시 넣어야 함
      levelsMoved: levelsToGolden,
      aisleCross: 0,
      feasible: levelsToGolden > 0,
    },
  )

  const horizontalOption = buildOption(
    "horizontal",
    "③ 인접 통로 이동",
    "회전율 높은 인접 통로로 수평 이동",
    row,
    p,
    {
      fromLabel: row.location.aisle,
      toLabel: "인접 프라임 통로",
      savedPerPick: CURRENT_AISLE_FACTOR * p.travelSecPerDepth,
      depthTravel: curDepth,
      levelsMoved: 0,
      aisleCross: 1,
      feasible: true,
    },
  )

  return [depthOption, verticalOption, horizontalOption]
}

// 세 대안 중 가장 유리한 안 (순이득 최대, 동률이면 Payback 짧은 순). 셋 다 기각이면 null.
export function bestMoveOption(options: MoveOption[]): MoveOption | null {
  const viable = options.filter((o) => o.feasible && o.verdict !== "reject")
  if (viable.length === 0) return null
  return [...viable].sort((a, b) => {
    if (b.netGainSec !== a.netGainSec) return b.netGainSec - a.netGainSec
    return a.paybackDays - b.paybackDays
  })[0]
}

// 리슬롯팅 후보: depth 조정(①) 기준으로 판단하되, 이동 비용상 기각이면 큐에 올리지 않는다.
export type ReslottingCandidate = {
  row: SkuRow
  grade: GradeResult
  currentDepth: number
  targetDepth: number
  depthDelta: number // 양수 = 더 얕게(전면), 음수 = 더 깊게
  direction: "forward" | "backward"
  move: MoveOption // 깊이 조정(①) 기준 비용/이득
  verdict: MoveVerdict
  // 후보가 된 사유 — 주문 유입으로 등급이 바뀌었는지, 초기 배치 불일치인지 구분
  reason: string
  gradeChanged: boolean
  baseGrade: SlotGrade
}

export function findReslottingCandidates(
  rows: SkuRow[],
  t: SlottingThresholds = DEFAULT_THRESHOLDS,
  p: MoveCostParams = DEFAULT_MOVE_PARAMS,
  baselineById?: Map<string, SkuRow>,
): ReslottingCandidate[] {
  const candidates: ReslottingCandidate[] = []
  for (const row of rows) {
    const grade = classifySlot(row, t)
    const currentDepth = row.location.depth
    const targetDepth = grade.targetDepth
    // minDepthGap 미만의 소폭 차이는 무시 (과도한 재배치 방지)
    if (Math.abs(currentDepth - targetDepth) < Math.max(1, t.minDepthGap)) continue

    const move = computeMoveOptions(row, grade, p)[0] // 깊이 조정 옵션
    // 이동 비용상 순이득이 없어 기각된 건은 큐에 올리지 않는다.
    if (move.verdict === "reject") continue

    const depthDelta = currentDepth - targetDepth

    // 주문 유입으로 등급이 바뀌었는지 판정: 베이스라인(주문 델타 없는 원본) 등급과 비교
    const base = baselineById?.get(row.skuId)
    const baseGrade = base ? classifySlot(base, t).finalGrade : grade.finalGrade
    const gradeChanged = baseGrade !== grade.finalGrade
    const reason = gradeChanged
      ? `주문 유입 → 리슬롯팅 (등급 변동 ${baseGrade}→${grade.finalGrade})`
      : "초기 배치와 권장 위치 불일치"

    candidates.push({
      row,
      grade,
      currentDepth,
      targetDepth,
      depthDelta,
      direction: depthDelta > 0 ? "forward" : "backward",
      move,
      verdict: move.verdict,
      reason,
      gradeChanged,
      baseGrade,
    })
  }
  // Payback 빠른 순 정렬
  return candidates.sort((a, b) => a.move.paybackDays - b.move.paybackDays)
}

// legacy abcClass와의 호환용 라벨
export function axisFromLegacy(cls: AbcClass): Axis {
  return cls
}

export function formatSec(sec: number): string {
  if (!isFinite(sec)) return "—"
  if (sec >= 60) return `${(sec / 60).toFixed(1)}분`
  return `${Math.round(sec)}초`
}

// 분 단위 표기 (부호 유지) — 순이득 등에 사용
export function formatMin(sec: number, signed = false): string {
  if (!isFinite(sec)) return "—"
  const min = sec / 60
  const body = `${Math.abs(min).toFixed(1)}분`
  if (signed) return `${min >= 0 ? "+" : "−"}${body}`
  return body
}

export function formatPayback(days: number): string {
  if (!isFinite(days)) return "—"
  if (days < 1) return `${(days * 24).toFixed(1)}시간`
  return `${days.toFixed(1)}일`
}
