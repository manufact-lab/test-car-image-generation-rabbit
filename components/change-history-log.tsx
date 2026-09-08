"use client"

import { useMemo, useState } from "react"
import {
  ShoppingCart,
  CheckCircle2,
  PauseCircle,
  ArrowRightLeft,
  SlidersHorizontal,
  History,
} from "lucide-react"
import { useReslotting, type HistoryEntry } from "@/components/reslotting-context"
import { formatMin } from "@/lib/reslotting"

type Kind = HistoryEntry["kind"]

const KIND_META: Record<
  Kind,
  { label: string; icon: typeof History; className: string }
> = {
  order: { label: "주문 유입", icon: ShoppingCart, className: "text-muted-foreground bg-muted" },
  approve: { label: "승인", icon: CheckCircle2, className: "text-primary bg-primary/15" },
  hold: { label: "보류", icon: PauseCircle, className: "text-warning bg-warning/15" },
  apply: { label: "이동 실행", icon: ArrowRightLeft, className: "text-success bg-success/15" },
  rule: { label: "룰 변경", icon: SlidersHorizontal, className: "text-foreground bg-secondary" },
}

const FILTERS: { key: Kind | "all"; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "apply", label: "이동 실행" },
  { key: "approve", label: "승인" },
  { key: "hold", label: "보류" },
  { key: "order", label: "주문" },
  { key: "rule", label: "룰" },
]

function timeStr(ts: number) {
  return new Date(ts).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

export function ChangeHistoryLog() {
  const { history } = useReslotting()
  const [filter, setFilter] = useState<Kind | "all">("all")

  const filtered = useMemo(
    () => (filter === "all" ? history : history.filter((h) => h.kind === filter)),
    [history, filter],
  )

  const applyCount = history.filter((h) => h.kind === "apply").length

  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <History className="size-4 text-primary" aria-hidden="true" />
          <div>
            <h2 className="text-sm font-semibold text-foreground">변경 이력 로그</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              모든 리슬롯팅 의사결정과 주문 이벤트의 감사 추적 (Audit Trail)
            </p>
          </div>
        </div>
        <span className="rounded-md bg-secondary px-2 py-1 text-xs font-medium tabular-nums text-secondary-foreground">
          이동 완료 {applyCount}건 · 총 {history.length}건
        </span>
      </div>

      {/* 필터 */}
      <div className="flex flex-wrap gap-1.5 border-b border-border px-5 py-3">
        {FILTERS.map((f) => {
          const active = filter === f.key
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              aria-pressed={active}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="px-5 py-12 text-center text-sm text-muted-foreground">
          기록된 이력이 없습니다.
        </div>
      ) : (
        <ol className="divide-y divide-border">
          {filtered.map((h) => {
            const meta = KIND_META[h.kind]
            const Icon = meta.icon
            return (
              <li key={h.id} className="flex gap-3 px-5 py-3">
                <span
                  className={`mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-md ${meta.className}`}
                >
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-sm font-medium text-foreground">{meta.label}</span>
                    {h.skuId !== "—" && (
                      <span className="font-mono text-xs text-muted-foreground">{h.skuId}</span>
                    )}
                    {h.beforeDepth !== undefined && h.afterDepth !== undefined && (
                      <span className="inline-flex items-center gap-1 rounded bg-secondary px-1.5 py-0.5 font-mono text-[11px] text-secondary-foreground">
                        {h.beforeDepth}-Deep
                        <span aria-hidden className="text-primary">→</span>
                        {h.afterDepth}-Deep
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{h.message}</p>
                  {h.reason && (
                    <p className="mt-0.5 text-[11px] text-muted-foreground/80">사유: {h.reason}</p>
                  )}
                  {h.predictedNetSec !== undefined && h.actualNetSec !== undefined && (
                    <div className="mt-1.5 inline-flex flex-wrap items-center gap-2 rounded-md border border-border bg-secondary/40 px-2 py-1">
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        순이득
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        예측{" "}
                        <span className="font-mono font-medium text-foreground">
                          {formatMin(h.predictedNetSec, true)}
                        </span>
                      </span>
                      <span aria-hidden className="text-muted-foreground/50">
                        vs
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        실제{" "}
                        <span
                          className={`font-mono font-medium ${
                            h.actualNetSec >= h.predictedNetSec ? "text-success" : "text-warning"
                          }`}
                        >
                          {formatMin(h.actualNetSec, true)}
                        </span>
                      </span>
                    </div>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-mono text-[11px] tabular-nums text-muted-foreground">
                    {timeStr(h.ts)}
                  </div>
                  <div className="text-[11px] text-muted-foreground/70">Day {h.simDay}</div>
                  {h.approver && (
                    <div className="mt-0.5 text-[11px] text-muted-foreground/70">{h.approver}</div>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
