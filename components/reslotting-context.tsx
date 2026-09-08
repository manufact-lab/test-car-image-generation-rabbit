"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { FACTORIES, type Factory, type SkuRow } from "@/lib/inventory-data"
import {
  DEFAULT_THRESHOLDS,
  findReslottingCandidates,
  classifySlot,
  type SlottingThresholds,
  type ReslottingCandidate,
} from "@/lib/reslotting"

// 큐 항목의 처리 상태
export type QueueDecision = "pending" | "approved" | "held" | "applied"

// 개별 주문 이벤트 (더미 주문 데이터 스트림)
export type OrderEvent = {
  id: string
  ts: number
  simDay: number // 시뮬레이션 상의 발생 일자
  skuId: string
  qty: number // 주문 수량 (EA)
  picks: number // 발생한 피킹 트랜잭션(주문 건수)
}

// 변경 이력 로그 엔트리
export type HistoryEntry = {
  id: string
  ts: number
  simDay: number
  skuId: string
  partName: string
  kind: "order" | "approve" | "hold" | "apply" | "rule"
  message: string
  beforeDepth?: number
  afterDepth?: number
  approver?: string
  reason?: string
}

const APPROVER = "관리자 (Kim)"
const TICK_MS = 1600 // 자동 시뮬레이션 1일 진행 간격

type ReslottingContextValue = {
  factory: Factory
  rows: SkuRow[] // 라이브 행 (주문 델타 반영)
  thresholds: SlottingThresholds
  setThresholds: (t: SlottingThresholds) => void
  windowDays: number
  setWindowDays: (n: number) => void
  candidates: ReslottingCandidate[]
  decisions: Record<string, QueueDecision>
  approve: (skuId: string) => void
  hold: (skuId: string) => void
  apply: (skuId: string) => void
  injectOrder: (skuId: string, qty: number, orders?: number) => void
  injectRandomBatch: () => void
  // P2 시뮬레이션 제어
  simDay: number
  playing: boolean
  togglePlay: () => void
  advanceDay: () => void
  resetSim: () => void
  orderEvents: OrderEvent[]
  history: HistoryEntry[]
  pendingCount: number
}

const ReslottingContext = createContext<ReslottingContextValue | null>(null)

let idCounter = 0
function nextId() {
  idCounter += 1
  return `e${idCounter}-${Date.now()}`
}

export function ReslottingProvider({
  factory = FACTORIES[1],
  children,
}: {
  factory?: Factory
  children: ReactNode
}) {
  const baseRows = factory.rows

  const [thresholds, setThresholdsState] = useState<SlottingThresholds>(DEFAULT_THRESHOLDS)
  const [windowDays, setWindowDaysState] = useState(7)
  const [orderEvents, setOrderEvents] = useState<OrderEvent[]>([])
  const [decisions, setDecisions] = useState<Record<string, QueueDecision>>({})
  const [appliedDepths, setAppliedDepths] = useState<Record<string, number>>({})
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [simDay, setSimDay] = useState(0)
  const [playing, setPlaying] = useState(false)

  // simDay의 동기적 소스 (이벤트 태깅용)
  const simDayRef = useRef(0)

  const log = useCallback((entry: Omit<HistoryEntry, "id" | "ts">) => {
    setHistory((prev) => [{ id: nextId(), ts: Date.now(), ...entry }, ...prev].slice(0, 300))
  }, [])

  // 베이스라인(주문 델타 없는 원본) — 등급 변동 판정용
  const baselineById = useMemo(
    () => new Map(baseRows.map((r) => [r.skuId, r])),
    [baseRows],
  )

  // 라이브 행: 원본 + Rolling window 주문 델타 + 적용된 depth 이동
  const rows = useMemo<SkuRow[]>(() => {
    const windowStart = simDay - windowDays
    const deltaMap = new Map<string, { outflow: number; picks: number; invConsumed: number }>()
    for (const ev of orderEvents) {
      const cur = deltaMap.get(ev.skuId) ?? { outflow: 0, picks: 0, invConsumed: 0 }
      cur.invConsumed += ev.qty // 재고 소모는 영구 반영
      // Rolling window: 윈도우 안의 주문만 현재 출고율/빈도에 반영 (오래된 스파이크는 소멸)
      if (ev.simDay > windowStart) {
        cur.outflow += ev.qty
        cur.picks += ev.picks
      }
      deltaMap.set(ev.skuId, cur)
    }

    return baseRows.map((row) => {
      const d = deltaMap.get(row.skuId)
      const appliedDepth = appliedDepths[row.skuId]
      if (!d && appliedDepth === undefined) return row
      return {
        ...row,
        dailyOutflow: row.dailyOutflow + (d?.outflow ?? 0),
        dailyPickFreq: row.dailyPickFreq + (d?.picks ?? 0),
        inventory: Math.max(0, row.inventory - (d?.invConsumed ?? 0)),
        location:
          appliedDepth !== undefined
            ? { ...row.location, depth: appliedDepth }
            : row.location,
      }
    })
  }, [baseRows, orderEvents, appliedDepths, simDay, windowDays])

  const candidates = useMemo(
    () => findReslottingCandidates(rows, thresholds, baselineById),
    [rows, thresholds, baselineById],
  )

  const setThresholds = useCallback(
    (t: SlottingThresholds) => {
      setThresholdsState(t)
      log({
        skuId: "—",
        partName: "슬롯 룰",
        kind: "rule",
        simDay: simDayRef.current,
        message: `임계값 조정: 물량 A≥${t.volumeA}/B≥${t.volumeB}, 빈도 A≥${t.freqA}/B≥${t.freqB}, 최소 Depth차 ${t.minDepthGap}`,
      })
    },
    [log],
  )

  const setWindowDays = useCallback(
    (n: number) => {
      setWindowDaysState(n)
      log({
        skuId: "—",
        partName: "슬롯 룰",
        kind: "rule",
        simDay: simDayRef.current,
        message: `Rolling window ${n}일로 조정`,
      })
    },
    [log],
  )

  const approve = useCallback(
    (skuId: string) => {
      setDecisions((prev) => ({ ...prev, [skuId]: "approved" }))
      const row = baseRows.find((r) => r.skuId === skuId)
      if (row)
        log({
          skuId,
          partName: row.partName,
          kind: "approve",
          simDay: simDayRef.current,
          approver: APPROVER,
          message: "리슬롯팅 승인됨",
        })
    },
    [baseRows, log],
  )

  const hold = useCallback(
    (skuId: string) => {
      setDecisions((prev) => ({ ...prev, [skuId]: "held" }))
      const row = baseRows.find((r) => r.skuId === skuId)
      if (row)
        log({
          skuId,
          partName: row.partName,
          kind: "hold",
          simDay: simDayRef.current,
          approver: APPROVER,
          message: "리슬롯팅 보류됨",
        })
    },
    [baseRows, log],
  )

  const apply = useCallback(
    (skuId: string) => {
      const cand = candidates.find((c) => c.row.skuId === skuId)
      if (!cand) return
      setAppliedDepths((prev) => ({ ...prev, [skuId]: cand.targetDepth }))
      setDecisions((prev) => ({ ...prev, [skuId]: "applied" }))
      log({
        skuId,
        partName: cand.row.partName,
        kind: "apply",
        simDay: simDayRef.current,
        beforeDepth: cand.currentDepth,
        afterDepth: cand.targetDepth,
        approver: APPROVER,
        reason: cand.reason,
        message: `${cand.currentDepth}-Deep → ${cand.targetDepth}-Deep 이동 실행`,
      })
    },
    [candidates, log],
  )

  const injectOrder = useCallback(
    (skuId: string, qty: number, orders = 1) => {
      const row = baseRows.find((r) => r.skuId === skuId)
      if (!row) return
      const day = simDayRef.current
      setOrderEvents((prev) => [
        ...prev,
        { id: nextId(), ts: Date.now(), simDay: day, skuId, qty, picks: orders },
      ])
      log({
        skuId,
        partName: row.partName,
        kind: "order",
        simDay: day,
        message: `주문 유입 +${qty} EA · 피킹 +${orders}`,
      })
    },
    [baseRows, log],
  )

  // 데모용: 무작위 SKU 몇 건에 주문 배치 주입 (빈도/물량 갱신 → 등급 변동 유도)
  const injectRandomBatch = useCallback(() => {
    const picks = [...baseRows].sort(() => Math.random() - 0.5).slice(0, 3)
    picks.forEach((row) => {
      const orders = 2 + Math.floor(Math.random() * 4) // 2~5건
      const qty = orders * (10 + Math.floor(Math.random() * 25))
      injectOrder(row.skuId, qty, orders)
    })
  }, [baseRows, injectOrder])

  const advanceDay = useCallback(() => {
    simDayRef.current += 1
    setSimDay(simDayRef.current)
  }, [])

  const resetSim = useCallback(() => {
    setPlaying(false)
    setOrderEvents([])
    setDecisions({})
    setAppliedDepths({})
    setHistory([])
    simDayRef.current = 0
    setSimDay(0)
  }, [])

  const togglePlay = useCallback(() => setPlaying((p) => !p), [])

  // 자동 시뮬레이션: 매 틱마다 하루 진행 + 주문 배치 유입
  const tickRef = useRef<() => void>(() => {})
  tickRef.current = () => {
    advanceDay()
    injectRandomBatch()
  }
  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => tickRef.current(), TICK_MS)
    return () => clearInterval(id)
  }, [playing])

  const pendingCount = useMemo(
    () =>
      candidates.filter(
        (c) => (decisions[c.row.skuId] ?? "pending") === "pending",
      ).length,
    [candidates, decisions],
  )

  const value: ReslottingContextValue = {
    factory,
    rows,
    thresholds,
    setThresholds,
    windowDays,
    setWindowDays,
    candidates,
    decisions,
    approve,
    hold,
    apply,
    injectOrder,
    injectRandomBatch,
    simDay,
    playing,
    togglePlay,
    advanceDay,
    resetSim,
    orderEvents,
    history,
    pendingCount,
  }

  return <ReslottingContext.Provider value={value}>{children}</ReslottingContext.Provider>
}

export function useReslotting() {
  const ctx = useContext(ReslottingContext)
  if (!ctx) throw new Error("useReslotting must be used within ReslottingProvider")
  return ctx
}

// 편의: 단일 SKU 등급 조회 (현재 임계값 반영)
export function useSlotGrade(row: SkuRow) {
  const { thresholds } = useReslotting()
  return useMemo(() => classifySlot(row, thresholds), [row, thresholds])
}
