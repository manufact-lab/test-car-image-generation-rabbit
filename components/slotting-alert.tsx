"use client"

import { useState } from "react"
import { Zap, X, ArrowRight } from "lucide-react"
import { useReslotting } from "@/components/reslotting-context"

export function SlottingAlert({ onReview }: { onReview?: () => void }) {
  const [open, setOpen] = useState(true)
  const { factory } = useReslotting()
  const alert = factory.slottingAlert

  if (!open) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[min(92vw,22rem)] animate-in fade-in slide-in-from-bottom-4">
      <div className="rounded-xl border border-primary/40 bg-popover p-4 shadow-2xl ring-1 ring-primary/20">
        <div className="flex items-start gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Zap className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">
                Dynamic Slotting 제안
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                aria-label="알림 닫기"
              >
                <X className="size-4" />
              </button>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              <span className="font-mono font-medium text-foreground">
                {alert.skuId}
              </span>
              를{" "}
              <span className="inline-flex items-center gap-1 font-medium text-foreground">
                {alert.from}
                <ArrowRight className="size-3 text-primary" />
                {alert.to}
              </span>
              로 재배치하세요.
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {alert.reason}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onReview?.()
                  setOpen(false)
                }}
                className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                큐에서 검토
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                나중에
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
