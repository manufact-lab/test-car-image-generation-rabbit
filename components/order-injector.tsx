"use client"

import { useState } from "react"
import { Play, Pause, ChevronsRight, RotateCcw } from "lucide-react"
import { useReslotting } from "@/components/reslotting-context"

export function OrderInjector() {
  const {
    rows,
    injectOrder,
    simDay,
    playing,
    togglePlay,
    advanceDay,
    resetSim,
  } = useReslotting()
  const [open, setOpen] = useState(false)
  const [skuId, setSkuId] = useState(rows[0]?.skuId ?? "")
  const [qty, setQty] = useState(50)

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* P2: 시뮬레이션 시계 */}
      <div className="flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1">
        <span className="text-xs text-muted-foreground">Sim Day</span>
        <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
          {simDay}
        </span>
      </div>

      {/* P2: 자동 재생 / 일시정지 */}
      <button
        onClick={togglePlay}
        aria-pressed={playing}
        className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
          playing
            ? "border-warning/40 bg-warning/15 text-warning hover:bg-warning/25"
            : "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
        }`}
      >
        {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
        {playing ? "일시정지" : "자동 재생"}
      </button>

      {/* P2: 하루 수동 진행 */}
      <button
        onClick={advanceDay}
        title="하루 진행 (Rolling window 이동)"
        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-2.5 py-1.5 text-sm font-medium text-secondary-foreground transition-colors hover:bg-accent"
      >
        <ChevronsRight className="size-3.5" />
        +1일
      </button>

      {/* 특정 SKU 주문 주입 */}
      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          주문 주입
        </button>

        {open && (
          <div className="absolute right-0 top-full z-20 mt-2 w-72 rounded-lg border border-border bg-popover p-3 shadow-xl">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">SKU</label>
            <select
              value={skuId}
              onChange={(e) => setSkuId(e.target.value)}
              className="mb-3 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
            >
              {rows.map((r) => (
                <option key={r.skuId} value={r.skuId}>
                  {r.skuId} · {r.partName}
                </option>
              ))}
            </select>

            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              주문 수량 (EA)
            </label>
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
              className="mb-3 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
            />

            <button
              onClick={() => {
                if (skuId) injectOrder(skuId, qty, Math.max(1, Math.round(qty / 20)))
                setOpen(false)
              }}
              className="w-full rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              주문 배치 주입
            </button>
          </div>
        )}
      </div>

      {/* 시뮬레이션 리셋 */}
      <button
        onClick={resetSim}
        title="시뮬레이션 초기화"
        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <RotateCcw className="size-3.5" />
        <span className="sr-only sm:not-sr-only">리셋</span>
      </button>
    </div>
  )
}
