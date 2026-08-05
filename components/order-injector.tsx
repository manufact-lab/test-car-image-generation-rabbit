"use client"

import { useState } from "react"
import { useReslotting } from "@/components/reslotting-context"

export function OrderInjector() {
  const { rows, injectOrder, injectRandomBatch } = useReslotting()
  const [open, setOpen] = useState(false)
  const [skuId, setSkuId] = useState(rows[0]?.skuId ?? "")
  const [qty, setQty] = useState(50)

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={injectRandomBatch}
        className="rounded-md border border-border bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground transition-colors hover:bg-accent"
      >
        랜덤 주문 배치 주입
      </button>

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
                if (skuId) injectOrder(skuId, qty)
                setOpen(false)
              }}
              className="w-full rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              주문 배치 주입
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
