// ---------------------------------------------------------------------------
// 데이터 분석 단계용 데이터셋
//
// 서연이화 차세대 물류 자동화 사업 데이터 분석 자료(2026년 3~4월 출하 데이터)를
// 재구성한 것. 엑셀 업로드 시 클렌징·집계·등급 산출을 거친 "분석 결과"로 표시된다.
// 모든 수치는 분석 대상 180,985건(7개 라인) 기준.
// ---------------------------------------------------------------------------

export type Grade = "A" | "B" | "C"

// ── 2.1 데이터 클렌징 ──────────────────────────────────────────────────────
export type CleansingRow = {
  line: string
  raw: number
  deleted: number
  kept: number
  excluded?: boolean // 분석 대상에서 제외된 라인
}

export const CLEANSING_ROWS: CleansingRow[] = [
  { line: "1공장 3라인", raw: 39740, deleted: 13, kept: 39727 },
  { line: "1공장 1라인", raw: 11758, deleted: 113, kept: 11645 },
  { line: "2공장 1라인", raw: 28822, deleted: 3, kept: 28819 },
  { line: "2공장 2라인", raw: 1007, deleted: 1007, kept: 0, excluded: true },
  { line: "3공장 1라인", raw: 43023, deleted: 3, kept: 43020 },
  { line: "3공장 2라인", raw: 26927, deleted: 12, kept: 26915 },
  { line: "4공장 2라인", raw: 15752, deleted: 0, kept: 15752 },
  { line: "5공장 1라인", raw: 15111, deleted: 4, kept: 15107 },
  { line: "E공장 1라인", raw: 106, deleted: 106, kept: 0, excluded: true },
]

export const CLEANSING_TOTAL = { raw: 182246, deleted: 1261, kept: 180985 }
export const RAW_LINE_COUNT = 9
export const KEPT_LINE_COUNT = 7
export const EXCLUDED_LINES = ["2공장 2라인", "E공장 1라인"]

// ── 2.2 일자별 출하건수 / SKU 추이 ─────────────────────────────────────────
export type DailyPoint = { date: string; shipments: number; skus: number; dip?: boolean }

export const DAILY_AVG_SHIPMENTS = 3733
export const DAILY_AVG_SKUS = 216

// 결정적 의사난수 (0~1)
function seeded(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

export function buildDailySeries(): DailyPoint[] {
  const start = new Date(2026, 2, 2) // 3월 2일
  const days = 60
  // 출하 건수가 절반 이하로 떨어진 4일 + 시작일
  const dipDays = new Map<number, { ship: number; sku: number }>([
    [15, { ship: 1405, sku: 49 }],
    [33, { ship: 1401, sku: 51 }],
    [41, { ship: 1423, sku: 53 }],
    [47, { ship: 1268, sku: 74 }],
  ])
  const pts: DailyPoint[] = []
  for (let i = 0; i < days; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const label = `${d.getMonth() + 1}월 ${d.getDate()}일`
    const dip = dipDays.get(i)
    if (i === 0) {
      pts.push({ date: label, shipments: 1268, skus: 74, dip: true })
    } else if (dip) {
      pts.push({ date: label, shipments: dip.ship, skus: dip.sku, dip: true })
    } else {
      const ship = 3550 + Math.round(seeded(i) * 465) // 3,550 ~ 4,015
      const sku = 185 + Math.round(seeded(i + 41) * 97) // 185 ~ 282
      pts.push({ date: label, shipments: ship, skus: sku })
    }
  }
  return pts
}

// ── 2.3 SKU별 ABC 분석 ─────────────────────────────────────────────────────
export type AbcRow = {
  grade: string
  sku: number
  skuPct: number
  cnt: number
  cntPct: number
}

export const ABC_ROWS: AbcRow[] = [
  { grade: "A등급", sku: 47, skuPct: 6.0, cnt: 126107, cntPct: 69.7 },
  { grade: "B등급", sku: 99, skuPct: 12.7, cnt: 36695, cntPct: 20.3 },
  { grade: "C등급", sku: 631, skuPct: 81.3, cnt: 18183, cntPct: 10.0 },
]
export const ABC_TOTAL = { sku: 777, cnt: 180985 }

// A는 47, B는 누적 146, C는 누적 777에서 100% 도달하는 파레토 곡선
export type ParetoPoint = { rank: number; cum: number }
export function buildParetoCurve(): ParetoPoint[] {
  const pts: ParetoPoint[] = []
  for (let i = 0; i <= 777; i += 7) {
    let pct: number
    if (i <= 47) pct = 69.7 * (1 - Math.pow(1 - i / 47, 1.7))
    else if (i <= 146) pct = 69.7 + 20.3 * ((i - 47) / (146 - 47))
    else pct = 90 + 10 * (1 - Math.pow(1 - (i - 146) / (777 - 146), 0.6))
    pts.push({ rank: i, cum: Math.min(100, Number(pct.toFixed(1))) })
  }
  return pts
}
export const ABC_BOUNDARIES = { a: 47, b: 146 }

// ── 2.4 등급별 출하일수 분석 ───────────────────────────────────────────────
export type DayCell = { sku: number; cnt: number; pct: number } | null
export type ShipDaysRow = { grade: Grade; cells: DayCell[] }

export const SHIP_DAYS_BUCKETS = ["1~2일", "3~5일", "6일 이상"]
export const SHIP_DAYS_ROWS: ShipDaysRow[] = [
  { grade: "A", cells: [{ sku: 46, cnt: 121207, pct: 69.1 }, { sku: 1, cnt: 800, pct: 0.5 }, null] },
  {
    grade: "B",
    cells: [
      { sku: 74, cnt: 28924, pct: 16.5 },
      { sku: 13, cnt: 6060, pct: 3.5 },
      { sku: 2, cnt: 601, pct: 0.3 },
    ],
  },
  {
    grade: "C",
    cells: [
      { sku: 33, cnt: 3779, pct: 2.2 },
      { sku: 167, cnt: 9908, pct: 5.6 },
      { sku: 430, cnt: 4209, pct: 2.4 },
    ],
  },
]
export const SHIP_DAYS_TOTALS: DayCell[] = [
  { sku: 153, cnt: 153910, pct: 87.7 },
  { sku: 181, cnt: 16768, pct: 9.6 },
  { sku: 432, cnt: 4810, pct: 2.7 },
]

// ── 2.5 생산-출하일자 GAP 분석 ─────────────────────────────────────────────
export type GapRow = { gap: string; sku: number; cnt: number; pct: number }
export const GAP_ROWS: GapRow[] = [
  { gap: "0", sku: 560, cnt: 104519, pct: 57.75 },
  { gap: "1", sku: 644, cnt: 46206, pct: 25.53 },
  { gap: "2", sku: 588, cnt: 14484, pct: 8.0 },
  { gap: "3", sku: 434, cnt: 6175, pct: 3.41 },
  { gap: "4", sku: 335, cnt: 3354, pct: 1.85 },
  { gap: "5", sku: 260, cnt: 1814, pct: 1.0 },
  { gap: "ETC", sku: 341, cnt: 4433, pct: 2.46 },
]
export const GAP_WITHIN_1DAY = 83.3

// ── 2.6 등급별 생산-출하일자 GAP 분석 ──────────────────────────────────────
export const GAP_LABELS = ["0", "1", "2", "3", "4", "5", "ETC"]
export type GapGrade = { grade: Grade; after2Pct: number; total: number; bars: number[] }
export const GAP_BY_GRADE: GapGrade[] = [
  { grade: "A", after2Pct: 14.6, total: 126107, bars: [79549, 28226, 8112, 3742, 2151, 1192, 3135] },
  { grade: "B", after2Pct: 20.1, total: 36695, bars: [17737, 11565, 3914, 1742, 792, 415, 530] },
  { grade: "C", after2Pct: 25.0, total: 18183, bars: [7233, 6404, 2458, 903, 484, 189, 512] },
]

// 등급별 GAP 막대 + 누적% 라인 데이터로 변환
export function buildGapGradeSeries(g: GapGrade) {
  let run = 0
  return g.bars.map((cnt, i) => {
    run += cnt
    return {
      gap: GAP_LABELS[i],
      cnt,
      cum: Number(((run / g.total) * 100).toFixed(1)),
    }
  })
}

// ── 2.7 SKU별 출하 라인 수 분석 ────────────────────────────────────────────
export type LineGroupRow = { grade: Grade; sku: number; cnt: number; pct: number }
export type LineGroup = {
  lines: number
  rows: LineGroupRow[]
  subtotal: { sku: number; cnt: number; pct: number }
}
export const LINES_PER_SKU: { groups: LineGroup[]; total: { sku: number; cnt: number; pct: number } } = {
  groups: [
    {
      lines: 3,
      rows: [
        { grade: "A", sku: 7, cnt: 30424, pct: 16.8 },
        { grade: "B", sku: 0, cnt: 0, pct: 0 },
        { grade: "C", sku: 0, cnt: 0, pct: 0 },
      ],
      subtotal: { sku: 7, cnt: 30424, pct: 16.8 },
    },
    {
      lines: 2,
      rows: [
        { grade: "A", sku: 14, cnt: 57843, pct: 31.9 },
        { grade: "B", sku: 16, cnt: 6412, pct: 3.6 },
        { grade: "C", sku: 39, cnt: 1994, pct: 1.1 },
      ],
      subtotal: { sku: 69, cnt: 66249, pct: 36.6 },
    },
    {
      lines: 1,
      rows: [
        { grade: "A", sku: 24, cnt: 37840, pct: 20.9 },
        { grade: "B", sku: 83, cnt: 30283, pct: 16.8 },
        { grade: "C", sku: 592, cnt: 16189, pct: 8.9 },
      ],
      subtotal: { sku: 699, cnt: 84312, pct: 46.6 },
    },
  ],
  total: { sku: 777, cnt: 180985, pct: 100 },
}
export const MULTI_LINE_PCT = 53.4
export const A_MULTI_LINE_SKU = 23

// 처리 단계(업로드 후 클렌징 애니메이션에 사용)
export const PROCESSING_STEPS = [
  "엑셀 파일 파싱 중",
  "생산일자 누락 데이터 제거 (1,261건)",
  "라인별 데이터 집계 (9개 라인)",
  "SKU별 ABC 등급 산출",
  "생산-출하 GAP 계산",
  "분석 리포트 생성",
]
