import {
  computeWarehouseSpec,
  DEFAULT_WAREHOUSE_SPEC,
  type WarehouseSpec,
  type WarehouseSpecResult,
} from "./inventory-data"
import { ABC_ROWS, STORAGE_SIZING, A_MULTI_LINE_SKU } from "./analysis-data"

// ---------------------------------------------------------------------------
// 분석 기반 배치 엔진 (브라운필드)
//
// 데이터 분석에서 나온 등급 구성(ABC)·다수 라인 공급 특성·필요 보관량을,
// 담당자가 키인한 4-way shuttle 창고 규격에 매핑한다.
// 산출물:
//   ① 등급별 존 배치 원칙 (어느 등급을 어느 깊이/레벨/통로에 둘지)
//   ② 키인한 규격의 용량이 필요 보관량(4,500 PLT 이상)을 충족하는지 판정
//   ③ 블록 빌더 초기 자동 배치 (레벨 × 베이 그리드)
// ---------------------------------------------------------------------------

export type PlacementGrade = "A" | "B" | "C"

export type ZoneAllocation = {
  grade: PlacementGrade
  sku: number
  skuPct: number
  shipmentPct: number // 출하 건수 비중(%)
  depthBand: string // 배치 깊이 대역 라벨
  level: string // 레벨(단) 배치
  access: string // 통로 접근 유형
  pickMode: string // 피킹 모드
  targetCellPct: number // 랙 셀 배정 목표 비중(%)
  rationale: string // 분석 근거
}

// 등급 → 색 토큰 (블록 빌더 · 범례 공통)
export const GRADE_COLOR: Record<PlacementGrade, string> = {
  A: "var(--color-primary)",
  B: "var(--color-warning)",
  C: "var(--color-muted-foreground)",
}

export const GRADE_LABEL: Record<PlacementGrade, string> = {
  A: "A등급",
  B: "B등급",
  C: "C등급",
}

// 분석 결과(ABC_ROWS)에서 등급별 SKU/출하 비중을 가져와 배치 원칙을 만든다.
function abc(grade: PlacementGrade) {
  const row = ABC_ROWS.find((r) => r.grade.startsWith(grade))!
  return { sku: row.sku, skuPct: row.skuPct, shipmentPct: row.cntPct }
}

export const ZONE_PLAN: ZoneAllocation[] = [
  {
    grade: "A",
    ...abc("A"),
    depthBand: "1~2 Deep (최전면)",
    level: "골든존 (중단)",
    access: "양면 · 프라임 통로",
    pickMode: "Dual-pick (양면 피킹)",
    targetCellPct: 22,
    rationale: `47 SKU가 전체 출하의 69.7%를 차지하는 초고빈도 구간. 다수 라인 공급 ${A_MULTI_LINE_SKU} SKU 포함 → 골든존 최전면 배치로 피킹 동선을 최소화한다.`,
  },
  {
    grade: "B",
    ...abc("B"),
    depthBand: "3 Deep (중간)",
    level: "중·상단",
    access: "양면",
    pickMode: "Flow-through (FIFO 관통)",
    targetCellPct: 28,
    rationale:
      "99 SKU · 출하 20.3%의 중빈도 구간. 중간 깊이에서 저장 밀도와 피킹 속도의 균형을 맞춘다.",
  },
  {
    grade: "C",
    ...abc("C"),
    depthBand: "4~5 Deep (심층)",
    level: "하단·후면",
    access: "단면 레인 우선 활용",
    pickMode: "LIFO (풀로트·비FIFO)",
    targetCellPct: 50,
    rationale:
      "631 SKU(81.3%)가 출하의 10%에 불과한 저빈도·대부분 단일 라인 구간. 고밀도 심층 보관하고, 단면 레인에는 1회 로트가 레인을 채우거나 비FIFO인 SKU를 배치한다.",
  },
]

// ── 용량 적정성 판정 ────────────────────────────────────────────────────────
export type CapacityAssessment = WarehouseSpecResult & {
  totalCells: number // 총 셀(팔레트 위치) 수 = 총 팔레트
  required: number // 필요 보관량 (PLT)
  ok: boolean // 용량 충족 여부
  surplus: number // 여유(부족) 팔레트
  fillPct: number // 필요 대비 사용률(%)
}

export function assessCapacity(spec: WarehouseSpec): CapacityAssessment {
  const r = computeWarehouseSpec(spec)
  const totalCells = r.totalPallets
  const required = STORAGE_SIZING.requiredPlt
  const surplus = totalCells - required
  return {
    ...r,
    totalCells,
    required,
    ok: totalCells >= required,
    surplus,
    fillPct: totalCells > 0 ? Math.round((required / totalCells) * 100) : 0,
  }
}

// ── 블록 빌더 자동 배치 ──────────────────────────────────────────────────────
// 레벨(단) × 베이(열) 그리드에 등급을 채운다. 골든존(중단)에서 가까울수록 A,
// 멀수록 C. 프라임 통로(앞쪽 베이)일수록 한 단계 얕은 등급으로 승급한다.
export function autoArrange(levels: number, bays: number): PlacementGrade[][] {
  const golden = (levels + 1) / 2 // 중단 골든존 기준선
  const maxDist = Math.max(golden - 1, levels - golden)
  const grid: PlacementGrade[][] = []
  for (let lv = levels; lv >= 1; lv--) {
    const row: PlacementGrade[] = []
    const levelDist = maxDist > 0 ? Math.abs(lv - golden) / maxDist : 0 // 0(골든)~1(끝)
    for (let b = 0; b < bays; b++) {
      const bayFactor = bays > 1 ? b / (bays - 1) : 0 // 0(프라임)~1(끝 통로)
      const score = levelDist * 0.7 + bayFactor * 0.3 // 0=A존, 1=C존
      row.push(score < 0.34 ? "A" : score < 0.67 ? "B" : "C")
    }
    grid.push(row)
  }
  return grid
}

export function countGrades(grid: PlacementGrade[][]): Record<PlacementGrade, number> {
  const c: Record<PlacementGrade, number> = { A: 0, B: 0, C: 0 }
  for (const row of grid) for (const g of row) c[g] += 1
  return c
}

export { DEFAULT_WAREHOUSE_SPEC }
export type { WarehouseSpec }
