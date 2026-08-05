"use client"

import { Activity } from "lucide-react"
import { useReslotting } from "@/components/reslotting-context"
import { SKU_ROWS } from "@/lib/inventory-data"

const nameById = new Map(SKU_ROWS.map((r) => [r.skuId, r.partName]))

export function OrderStream() {
  const { orderEvents, simDay, windowDays, setWindowDays } = useReslotting()
  const windowStart = simDay - windowDays
  // 최신순
  const events = [...orderEvents].reverse().slice(0, 40)

  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <Activity className="size-4 text-primary" aria-hidden="true" />
          <div>
            <h2 className="text-sm font-semibold text-foreground">주문 데이터 스트림</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              유입 주문 이벤트 · Rolling window {windowDays}일 이내 건만 등급에 반영
            </p>
          </div>
        </div>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Window</span>
          <select
            value={windowDays}
            onChange={(e) => setWindowDays(Number(e.target.value))}
            className="rounded-md border border-input bg-background px-2 py-1 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          >
            {[3, 5, 7, 14, 30].map((d) => (
              <option key={d} value={d}>
                {d}일
              </option>
            ))}
          </select>
        </label>
      </div>

      {events.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-muted-foreground">
          아직 유입된 주문이 없습니다. 상단에서 &quot;자동 재생&quot; 또는 &quot;주문 주입&quot;을 실행하세요.
        </div>
      ) : (
        <ul className="max-h-[420px] divide-y divide-border overflow-y-auto">
          {events.map((ev) => {
            const inWindow = ev.simDay > windowStart
            return (
              <li
                key={ev.id}
                className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className={`size-2 shrink-0 rounded-full ${
                      inWindow ? "bg-primary" : "bg-muted-foreground/40"
                    }`}
                    aria-hidden="true"
                  />
                  <span className="font-mono text-xs font-medium text-foreground">
                    {ev.skuId}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {nameById.get(ev.skuId) ?? ""}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="font-mono text-xs tabular-nums text-primary">
                    +{ev.qty} EA
                  </span>
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">
                    {ev.picks} 피킹
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${
                      inWindow
                        ? "bg-primary/15 text-primary"
                        : "bg-muted text-muted-foreground line-through"
                    }`}
                    title={inWindow ? "윈도우 내 · 등급 반영" : "윈도우 만료 · 등급 미반영"}
                  >
                    D{ev.simDay}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
