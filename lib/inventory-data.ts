export type VehicleType = "sedan" | "suv" | "truck" | "van" | "hatchback"

// Where the part physically sits on the vehicle chassis (drives 3D highlight)
export type ChassisZone =
  | "engine"
  | "front-axle"
  | "rear-axle"
  | "cabin"
  | "underbody"

export type WarehouseLocation = {
  zone: string // e.g. "Zone B"
  aisle: string // e.g. "A-04"
  rack: number // rack column index (1-based)
  level: number // shelf level (1 = ground)
  depth: number // 4-Way shuttle lane depth position
}

// Destination assembly line the part is shipped to.
// A SKU can feed a single line or multiple lines.
export type ShipLine = {
  plant: number // factory number, e.g. 2 -> "2공장"
  line: number // assembly line number, e.g. 1 -> "1라인"
}

export function formatShipLine(l: ShipLine): string {
  return `${l.plant}공장 ${l.line}라인`
}

const HYUNDAI_MODELS = ["CN7", "RG3", "IK", "RG3 EV", "SX2", "RS4", "QX"]

// Deterministic hash so server and client render the same value (no hydration mismatch).
function seededIndex(seed: string, mod: number): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) | 0
  }
  return Math.abs(h) % mod
}

function getRandomModel(seed: string): string {
  return HYUNDAI_MODELS[seededIndex(seed + "-model", HYUNDAI_MODELS.length)]
}

// 적용 부품 = 도어트림(Door Trim). 자동차 문 4곳 중 1곳에 장착된다.
//  FL = 앞문 왼쪽, FR = 앞문 오른쪽, RL = 뒷문 왼쪽, RR = 뒷문 오른쪽
export type DoorTrim = "DT FL" | "DT FR" | "DT RL" | "DT RR"

// 짧은 한글 위치 라벨 (테이블/뱃지용)
export const DOOR_TRIM_LABELS: Record<DoorTrim, string> = {
  "DT FL": "앞문 좌",
  "DT FR": "앞문 우",
  "DT RL": "뒷문 좌",
  "DT RR": "뒷문 우",
}

// 상세 위치 라벨 (상세뷰/3D용)
export const DOOR_TRIM_FULL: Record<DoorTrim, string> = {
  "DT FL": "앞문 왼쪽 (Front Left)",
  "DT FR": "앞문 오른쪽 (Front Right)",
  "DT RL": "뒷문 왼쪽 (Rear Left)",
  "DT RR": "뒷문 오른쪽 (Rear Right)",
}

const DOOR_TRIMS: DoorTrim[] = ["DT FL", "DT FR", "DT RL", "DT RR"]

function getRandomDoorTrim(seed: string): DoorTrim {
  return DOOR_TRIMS[seededIndex(seed + "-door", DOOR_TRIMS.length)]
}

export type SkuRow = {
  skuId: string
  partName: string
  vehicles: VehicleType[]
  inventory: number // EA in stock
  dailyOutflow: number // EA / day (물량 = 하루에 나가는 수량)
  dailyPickFreq: number // picks / day (빈도 = 하루에 몇 번 집는지, 오더 라인 수)
  category: string
  weightKg: number
  unitCost: number // USD
  chassisZone: ChassisZone
  location: WarehouseLocation
  shipLines: ShipLine[] // destination assembly line(s)
  modelName?: string // Hyundai model name
  doorTrim: DoorTrim // 적용 부품(도어트림) 장착 위치
}

export const CHASSIS_ZONE_LABELS: Record<ChassisZone, string> = {
  engine: "Engine Bay",
  "front-axle": "Front Axle",
  "rear-axle": "Rear Axle",
  cabin: "Cabin",
  underbody: "Underbody",
}

export type DosTier = "critical" | "optimal" | "stable"

export const VEHICLE_LABELS: Record<VehicleType, string> = {
  sedan: "Sedan",
  suv: "SUV",
  truck: "Pickup",
  van: "Van",
  hatchback: "Hatchback",
}

// Days of Supply = inventory / dailyOutflow
export function daysOfSupply(row: SkuRow): number {
  if (row.dailyOutflow <= 0) return Infinity
  return row.inventory / row.dailyOutflow
}

export function dosTier(dos: number): DosTier {
  if (dos <= 3) return "critical"
  if (dos <= 7) return "optimal"
  return "stable"
}

// ABC classification by outflow velocity (used for shuttle slotting depth)
export type AbcClass = "A" | "B" | "C"

export function abcClass(row: SkuRow): AbcClass {
  if (row.dailyOutflow >= 120) return "A"
  if (row.dailyOutflow >= 45) return "B"
  return "C"
}

export function recommendedDepth(cls: AbcClass): string {
  if (cls === "A") return "1–2 Deep"
  if (cls === "B") return "3 Deep"
  return "4–5 Deep"
}

// 모든 제품은 도어트림이다. partName은 doorTrim 장착 위치에서 파생하므로 raw에서는 제외한다.
const SKU_ROWS_RAW: Omit<SkuRow, "modelName" | "doorTrim" | "partName">[] = [
  {
    skuId: "BRK-PAD-0192",
    vehicles: ["sedan", "suv"],
    inventory: 84,
    dailyOutflow: 168,
    dailyPickFreq: 6, // 물량A·빈도C: 대량이지만 몰아서 출고 → 3-Deep 고밀도 (정상 배치)
    category: "Braking",
    weightKg: 2.4,
    unitCost: 38,
    chassisZone: "front-axle",
    location: { zone: "Zone A", aisle: "A-02", rack: 3, level: 2, depth: 3 },
    shipLines: [
      { plant: 2, line: 1 },
      { plant: 3, line: 2 },
    ],
  },
  {
    skuId: "OIL-FLT-2231",
    vehicles: ["sedan", "hatchback", "van"],
    inventory: 1420,
    dailyOutflow: 210,
    dailyPickFreq: 52, // 물량A·빈도A: 정합
    category: "Filtration",
    weightKg: 0.3,
    unitCost: 9,
    chassisZone: "engine",
    location: { zone: "Zone A", aisle: "A-05", rack: 6, level: 1, depth: 1 },
    shipLines: [
      { plant: 1, line: 1 },
      { plant: 1, line: 3 },
      { plant: 3, line: 1 },
    ],
  },
  {
    skuId: "ALT-BLT-7788",
    vehicles: ["truck", "van"],
    inventory: 96,
    dailyOutflow: 24,
    dailyPickFreq: 8, // 물량C·빈도C: 정합
    category: "Engine",
    weightKg: 0.6,
    unitCost: 22,
    chassisZone: "engine",
    location: { zone: "Zone C", aisle: "C-01", rack: 2, level: 4, depth: 5 },
    shipLines: [{ plant: 4, line: 2 }],
  },
  {
    skuId: "CAB-AIR-3310",
    vehicles: ["sedan", "suv", "hatchback"],
    inventory: 640,
    dailyOutflow: 88,
    dailyPickFreq: 31, // 물량B·빈도B: 정합
    category: "Filtration",
    weightKg: 0.2,
    unitCost: 12,
    chassisZone: "cabin",
    location: { zone: "Zone B", aisle: "B-03", rack: 4, level: 3, depth: 3 },
    shipLines: [
      { plant: 2, line: 2 },
      { plant: 3, line: 2 },
    ],
  },
  {
    skuId: "SPK-PLG-5521",
    vehicles: ["sedan", "hatchback"],
    inventory: 210,
    dailyOutflow: 145,
    dailyPickFreq: 44, // 물량A·빈도A: 정합
    category: "Ignition",
    weightKg: 0.1,
    unitCost: 16,
    chassisZone: "engine",
    location: { zone: "Zone A", aisle: "A-01", rack: 1, level: 2, depth: 1 },
    shipLines: [{ plant: 1, line: 2 }],
  },
  {
    skuId: "SHK-ABS-9014",
    vehicles: ["suv", "truck"],
    inventory: 58,
    dailyOutflow: 132,
    dailyPickFreq: 40, // 물량A·빈도A → 권장 1-Deep. 현재 5-Deep에 오배치된 기존 리슬롯팅 대상
    category: "Suspension",
    weightKg: 3.8,
    unitCost: 74,
    chassisZone: "rear-axle",
    location: { zone: "Zone C", aisle: "C-04", rack: 5, level: 1, depth: 5 },
    shipLines: [
      { plant: 3, line: 1 },
      { plant: 4, line: 1 },
    ],
  },
  {
    skuId: "WPR-BLD-1102",
    vehicles: ["sedan", "suv", "van", "hatchback"],
    inventory: 2100,
    dailyOutflow: 60,
    dailyPickFreq: 38, // 물량B·빈도A → 권장 2-Deep (자주 집혀 전면 배치)
    category: "Body",
    weightKg: 0.4,
    unitCost: 11,
    chassisZone: "cabin",
    location: { zone: "Zone B", aisle: "B-06", rack: 7, level: 4, depth: 2 },
    shipLines: [
      { plant: 1, line: 1 },
      { plant: 2, line: 1 },
      { plant: 2, line: 2 },
      { plant: 4, line: 2 },
    ],
  },
  {
    skuId: "RAD-HSE-4409",
    vehicles: ["truck", "van"],
    inventory: 38,
    dailyOutflow: 96,
    dailyPickFreq: 34, // 물량B·빈도B → 권장 3-Deep. 빈도가 35 넘으면 A로 승급(주문 유입 데모용 경계값)
    category: "Cooling",
    weightKg: 0.7,
    unitCost: 19,
    chassisZone: "engine",
    location: { zone: "Zone C", aisle: "C-02", rack: 3, level: 3, depth: 3 },
    shipLines: [{ plant: 4, line: 1 }],
  },
  {
    skuId: "BAT-12V-6600",
    vehicles: ["sedan", "suv", "truck", "van"],
    inventory: 305,
    dailyOutflow: 42,
    dailyPickFreq: 47, // 물량C·빈도A: 무거워 낱개로 자주 집힘 → 룰1로 2-Deep 전면 승급
    category: "Electrical",
    weightKg: 14.2,
    unitCost: 129,
    chassisZone: "engine",
    location: { zone: "Zone B", aisle: "B-01", rack: 2, level: 1, depth: 2 },
    shipLines: [
      { plant: 1, line: 1 },
      { plant: 2, line: 1 },
      { plant: 3, line: 1 },
      { plant: 4, line: 1 },
    ],
  },
  {
    skuId: "TIE-ROD-2048",
    vehicles: ["suv", "truck"],
    inventory: 14,
    dailyOutflow: 33,
    dailyPickFreq: 41, // 물량C·빈도A: 소량이지만 매우 자주 집힘 → 룰1로 2-Deep 전면 승급
    category: "Steering",
    weightKg: 1.1,
    unitCost: 28,
    chassisZone: "front-axle",
    location: { zone: "Zone C", aisle: "C-03", rack: 4, level: 2, depth: 2 },
    shipLines: [
      { plant: 3, line: 2 },
      { plant: 4, line: 2 },
    ],
  },
]

// Assign deterministic (seeded by skuId) model + door trim so server and client match.
// 모든 제품은 도어트림이므로 partName도 장착 위치에서 파생한다. (예: "도어트림 · 앞문 좌")
export const SKU_ROWS: SkuRow[] = SKU_ROWS_RAW.map((row) => {
  const doorTrim = getRandomDoorTrim(row.skuId)
  return {
    ...row,
    modelName: getRandomModel(row.skuId),
    doorTrim,
    partName: `도어트림 · ${DOOR_TRIM_LABELS[doorTrim]}`,
  }
})

// Picking efficiency vs storage depth for a 4-Way shuttle lane.
// Deeper storage = higher density but slower retrieval (more shuffles).
export function depthEfficiencyCurve(row: SkuRow) {
  const cls = abcClass(row)
  // Retrieval penalty grows per depth; fast movers (A) suffer most when buried.
  const penaltyPerDepth = cls === "A" ? 15 : cls === "B" ? 9 : 5
  return Array.from({ length: 5 }, (_, i) => {
    const depth = i + 1
    const pickEfficiency = Math.max(20, 100 - (depth - 1) * penaltyPerDepth)
    const storageDensity = 40 + (depth - 1) * 15 // deeper = denser
    return {
      depth: `${depth}-Deep`,
      depthNum: depth,
      pickEfficiency,
      storageDensity: Math.min(100, storageDensity),
      current: depth === row.location.depth,
    }
  })
}

// The depth that maximizes combined pick + density score.
export function optimalDepth(row: SkuRow): number {
  const curve = depthEfficiencyCurve(row)
  const cls = abcClass(row)
  // Weight picking speed higher for fast movers.
  const w = cls === "A" ? 0.75 : cls === "B" ? 0.55 : 0.35
  let best = curve[0]
  let bestScore = -Infinity
  for (const p of curve) {
    const score = p.pickEfficiency * w + p.storageDensity * (1 - w)
    if (score > bestScore) {
      bestScore = score
      best = p
    }
  }
  return best.depthNum
}

export const WAREHOUSE = {
  usedPallets: 8500,
  totalPallets: 10000,
}

export type SlottingAlert = {
  skuId: string
  from: string
  to: string
  reason: string
}

export const SLOTTING_ALERT: SlottingAlert = {
  skuId: "SHK-ABS-9014",
  from: "5-Deep",
  to: "1-Deep",
  reason: "Outflow velocity jumped +186% over the last 14 days.",
}
