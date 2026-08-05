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

// 리슬롯팅 후보: 현재 depth와 권장 targetDepth가 minDepthGap 이상 다르면 이동 후보.
export type ReslottingCandidate = {
  row: SkuRow
  grade: GradeResult
  currentDepth: number
  targetDepth: number
  depthDelta: number // 양수 = 더 얕게(전면), 음수 = 더 깊게
  direction: "forward" | "backward"
  benefit: CostBenefit
  // 후보가 된 사유 — 주문 유입으로 등급이 바뀌었는지, 초기 배치 불일치인지 구분
  reason: string
  gradeChanged: boolean
  baseGrade: SlotGrade
}

export type CostBenefit = {
  // 하루에 아끼는 피킹 시간(초). 빈도 × depth당 이동 패널티.
  dailyTimeSavedSec: number
  // 이동 1회 비용(초). 셔틀 셔플 횟수 기반.
  moveCostSec: number
  // 회수 일수 (이동비용 / 하루절감). 낮을수록 좋음.
  paybackDays: number
  score: number // 종합 우선순위 점수
}

const SEC_PER_DEPTH_PICK = 8 // depth 한 칸 더 깊을 때 피킹당 추가 소요 초
const MOVE_SEC_PER_DEPTH = 45 // 셔틀로 한 칸 옮기는 데 드는 초

export function costBenefit(
  row: SkuRow,
  currentDepth: number,
  targetDepth: number,
): CostBenefit {
  const depthDelta = currentDepth - targetDepth // 양수면 얕아짐(개선)
  const dailyTimeSavedSec = Math.max(0, depthDelta) * SEC_PER_DEPTH_PICK * row.dailyPickFreq
  const moveCostSec = Math.abs(depthDelta) * MOVE_SEC_PER_DEPTH
  const paybackDays = dailyTimeSavedSec > 0 ? moveCostSec / dailyTimeSavedSec : Infinity
  // 점수: 하루 절감이 클수록, 회수기간이 짧을수록 높음.
  const score = dailyTimeSavedSec / (paybackDays === Infinity ? 999 : paybackDays + 0.5)
  return { dailyTimeSavedSec, moveCostSec, paybackDays, score }
}

export function findReslottingCandidates(
  rows: SkuRow[],
  t: SlottingThresholds = DEFAULT_THRESHOLDS,
  baselineById?: Map<string, SkuRow>,
): ReslottingCandidate[] {
  const candidates: ReslottingCandidate[] = []
  for (const row of rows) {
    const grade = classifySlot(row, t)
    const currentDepth = row.location.depth
    const targetDepth = grade.targetDepth
    // minDepthGap 미만의 소폭 차이는 무시 (과도한 재배치 방지)
    if (Math.abs(currentDepth - targetDepth) < Math.max(1, t.minDepthGap)) continue

    const depthDelta = currentDepth - targetDepth
    const benefit = costBenefit(row, currentDepth, targetDepth)

    // 주문 유입으로 등급이 바뀌었는지 판정: 베이스라인(주문 델타 없는 원본) 등급과 비교
    const base = baselineById?.get(row.skuId)
    const baseGrade = base ? classifySlot(base, t).finalGrade : grade.finalGrade
    const gradeChanged = baseGrade !== grade.finalGrade
    const reason = gradeChanged
      ? `주문 유입 → 등급 ${baseGrade} → ${grade.finalGrade} 변동`
      : "초기 배치와 권장 위치 불일치"

    candidates.push({
      row,
      grade,
      currentDepth,
      targetDepth,
      depthDelta,
      direction: depthDelta > 0 ? "forward" : "backward",
      benefit,
      reason,
      gradeChanged,
      baseGrade,
    })
  }
  // 우선순위 정렬: 주문 유입으로 변동된 건 우선, 그다음 비용편익 점수순
  return candidates.sort((a, b) => {
    if (a.gradeChanged !== b.gradeChanged) return a.gradeChanged ? -1 : 1
    return b.benefit.score - a.benefit.score
  })
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
