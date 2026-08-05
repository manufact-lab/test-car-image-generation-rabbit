"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { SKU_ROWS, type SkuRow } from "@/lib/inventory-data"
import {
  DEFAULT_THRESHOLDS,
  findReslottingCandidates,
  classifySlot,
  type SlottingThresholds,
  type ReslottingCandidate,
} from "@/lib/reslotting"

// 큐 항목의 처리 상태
export type QueueDecision = "pending" | "approved" | "held" | "applied"

// 변경 이력 로그 엔트리
export type HistoryEntry = {
  id: string
  ts: number
  skuId: string
  partName: string
  kind: "order" | "approve" | "hold" | "apply" | "rule"
  message: string
}

// 주입된 주문이 SKU에 남기는 누적 델타
type OrderDelta = {
  outflow: number // dailyOutflow 증가분
  freq: number // dailyPickFreq 증가분
  invConsumed: number // 재고 소모분
}

type ReslottingContextValue = {
  rows: SkuRow[] // 라이브 행 (주문 델타 반영)
  thresholds: SlottingThresholds
  setThresholds: (t: SlottingThresholds) => void
  candidates: ReslottingCandidate[]
  decisions: Record<string, QueueDecision>
  approve: (skuId: string) => void
  hold: (skuId: string) => void
  apply: (skuId: string) => void
  injectOrder: (skuId: string, qty: number) => void
  injectRandomBatch: () => void
  history: HistoryEntry[]
  pendingCount: number
}

const ReslottingContext = createContext<ReslottingContextValue | null>(null)

let historyCounter = 0
function nextId() {
  historyCounter += 1
  return `h${historyCounter}-${Date.now()}`
}

export function ReslottingProvider({ children }: { children: ReactNode }) {
  const [thresholds, setThresholdsState] = useState<SlottingThresholds>(DEFAULT_THRESHOLDS)
  const [deltas, setDeltas] = useState<Record<string, OrderDelta>>({})
  const [decisions, setDecisions] = useState<Record<string, QueueDecision>>({})
  const [appliedDepths, setAppliedDepths] = useState<Record<string, number>>({})
  const [history, setHistory] = useState<HistoryEntry[]>([])

  const log = useCallback((entry: Omit<HistoryEntry, "id" | "ts">) => {
    setHistory((prev) => [{ id: nextId(), ts: Date.now(), ...entry }, ...prev].slice(0, 200))
  }, [])

  // 라이브 행: 원본 + 주문 델타 + 적용된 depth 이동
  const rows = useMemo<SkuRow[]>(() => {
    return SKU_ROWS.map((row) => {
      const d = deltas[row.skuId]
      const appliedDepth = appliedDepths[row.skuId]
      if (!d && appliedDepth === undefined) return row
      return {
        ...row,
        dailyOutflow: row.dailyOutflow + (d?.outflow ?? 0),
        dailyPickFreq: row.dailyPickFreq + (d?.freq ?? 0),
        inventory: Math.max(0, row.inventory - (d?.invConsumed ?? 0)),
        location:
          appliedDepth !== undefined
            ? { ...row.location, depth: appliedDepth }
            : row.location,
      }
    })
  }, [deltas, appliedDepths])

  const candidates = useMemo(
    () => findReslottingCandidates(rows, thresholds),
    [rows, thresholds],
  )

  const setThresholds = useCallback(
    (t: SlottingThresholds) => {
      setThresholdsState(t)
      log({
        skuId: "—",
        partName: "슬롯 룰",
        kind: "rule",
        message: `임계값 조정: 물량 A≥${t.volumeA}/B≥${t.volumeB}, 빈도 A≥${t.freqA}/B≥${t.freqB}`,
      })
    },
    [log],
  )

  const approve = useCallback(
    (skuId: string) => {
      setDecisions((prev) => ({ ...prev, [skuId]: "approved" }))
      const row = rows.find((r) => r.skuId === skuId)
      if (row) log({ skuId, partName: row.partName, kind: "approve", message: "리슬롯팅 승인됨" })
    },
    [rows, log],
  )

  const hold = useCallback(
    (skuId: string) => {
      setDecisions((prev) => ({ ...prev, [skuId]: "held" }))
      const row = rows.find((r) => r.skuId === skuId)
      if (row) log({ skuId, partName: row.partName, kind: "hold", message: "리슬롯팅 보류됨" })
    },
    [rows, log],
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
        message: `${cand.currentDepth}-Deep → ${cand.targetDepth}-Deep 이동 실행`,
      })
    },
    [candidates, log],
  )

  const injectOrder = useCallback(
    (skuId: string, qty: number) => {
      const row = SKU_ROWS.find((r) => r.skuId === skuId)
      if (!row) return
      setDeltas((prev) => {
        const cur = prev[skuId] ?? { outflow: 0, freq: 0, invConsumed: 0 }
        return {
          ...prev,
          [skuId]: {
            outflow: cur.outflow + qty,
            freq: cur.freq + 1, // 주문 1건 = 피킹 1회
            invConsumed: cur.invConsumed + qty,
          },
        }
      })
      log({
        skuId,
        partName: row.partName,
        kind: "order",
        message: `주문 유입 +${qty} EA (피킹 +1)`,
      })
    },
    [log],
  )

  // 데모용: 무작위 SKU 몇 건에 주문 배치 주입 (등급 변동 유도)
  const injectRandomBatch = useCallback(() => {
    const picks = [...SKU_ROWS].sort(() => Math.random() - 0.5).slice(0, 3)
    picks.forEach((row) => {
      const qty = 20 + Math.floor(Math.random() * 90)
      injectOrder(row.skuId, qty)
    })
  }, [injectOrder])

  const pendingCount = useMemo(
    () =>
      candidates.filter(
        (c) => (decisions[c.row.skuId] ?? "pending") === "pending",
      ).length,
    [candidates, decisions],
  )

  const value: ReslottingContextValue = {
    rows,
    thresholds,
    setThresholds,
    candidates,
    decisions,
    approve,
    hold,
    apply,
    injectOrder,
    injectRandomBatch,
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
