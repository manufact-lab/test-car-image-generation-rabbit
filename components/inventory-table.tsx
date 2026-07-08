"use client"

import { useState } from "react"
import { AlarmClock, ChevronRight } from "lucide-react"
import {
  SKU_ROWS,
  daysOfSupply,
  dosTier,
  type SkuRow,
} from "@/lib/inventory-data"
import { StatusBadge } from "@/components/status-badge"
import { SkuDetailView } from "@/components/sku-detail-view"
import { cn } from "@/lib/utils"

function DosCell({ dos }: { dos: number }) {
  // Sub-1-day: convert to hours and warn in red.
  if (dos < 1) {
    const hours = Math.round(dos * 24)
    return (
      <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
        <span className="font-mono text-sm font-semibold tabular-nums text-destructive">
          {dos.toFixed(1)}일
        </span>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-destructive/15 px-1.5 py-0.5 text-xs font-medium text-destructive">
          <AlarmClock className="size-3" aria-hidden="true" />
          {hours}시간 남음
        </span>
      </div>
    )
  }

  const tier = dosTier(dos)
  return (
    <span
      className={cn(
        "font-mono text-sm font-semibold tabular-nums",
        tier === "critical" && "text-destructive",
        tier === "optimal" && "text-warning",
        tier === "stable" && "text-success",
      )}
    >
      {dos.toFixed(1)}일
    </span>
  )
}

export function InventoryTable() {
  const rows = [...SKU_ROWS].sort((a, b) => daysOfSupply(a) - daysOfSupply(b))
  const [selected, setSelected] = useState<SkuRow | null>(null)

  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="flex flex-col gap-1 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            SKU별 재고 및 차종 매핑
          </h2>
          <p className="text-sm text-muted-foreground">
            재고 일수(Days of Supply) 오름차순 · 행 클릭 시 상세 분석 열림
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-destructive" /> ≤ 3일
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-warning" /> 3–7일
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-success" /> {">"} 7일
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] border-collapse text-left">
          <thead>
            <tr className="whitespace-nowrap text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-5 py-3 font-medium">SKU ID</th>
              <th className="px-5 py-3 font-medium">적용 차종</th>
              <th className="px-5 py-3 text-right font-medium">현재 보관량</th>
              <th className="px-5 py-3 text-right font-medium">일일 소요량</th>
              <th className="px-5 py-3 text-right font-medium">재고 일수</th>
              <th className="px-5 py-3 font-medium">상태</th>
              <th className="w-10 px-5 py-3 font-medium">
                <span className="sr-only">상세</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const dos = daysOfSupply(row)
              return (
                <tr
                  key={row.skuId}
                  tabIndex={0}
                  role="button"
                  aria-label={`${row.skuId} 상세 보기`}
                  onClick={() => setSelected(row)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      setSelected(row)
                    }
                  }}
                  className="group cursor-pointer border-t border-border outline-none transition-colors hover:bg-secondary/40 focus-visible:bg-secondary/40"
                >
                  <td className="px-5 py-4">
                    <div className="font-mono text-sm font-medium text-foreground">
                      {row.skuId}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <span className="font-mono text-foreground">
                        {row.doorTrim}
                      </span>{" "}
                      · 도어트림
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1 font-mono text-sm font-medium text-primary">
                      {row.modelName}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right font-mono text-sm tabular-nums text-foreground">
                    {row.inventory.toLocaleString()}
                    <span className="ml-1 text-xs text-muted-foreground">EA</span>
                  </td>
                  <td className="px-5 py-4 text-right font-mono text-sm tabular-nums text-muted-foreground">
                    {row.dailyOutflow.toLocaleString()}
                    <span className="ml-1 text-xs">EA/일</span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <DosCell dos={dos} />
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge tier={dosTier(dos)} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <ChevronRight
                      className="ml-auto size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                      aria-hidden="true"
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {selected && (
        <SkuDetailView row={selected} onClose={() => setSelected(null)} />
      )}
    </section>
  )
}
