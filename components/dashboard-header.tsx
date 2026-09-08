import Link from "next/link"
import { Boxes, RefreshCw, ChevronsUpDown } from "lucide-react"
import type { Factory } from "@/lib/inventory-data"

export function DashboardHeader({ factory }: { factory: Factory }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <Link
            href="/"
            className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-opacity hover:opacity-90"
            aria-label="공장 선택으로 이동"
          >
            <Boxes className="size-5" aria-hidden="true" />
          </Link>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-foreground">ShuttleIQ</p>
            <p className="text-xs text-muted-foreground">Warehouse Inventory Optimizer</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* 공장/창고 전환 (공장 선택 화면으로 이동) */}
          <Link
            href="/"
            title="공장 전환"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            <span className="flex size-5 items-center justify-center rounded bg-primary/15 font-mono text-xs font-semibold text-primary">
              {factory.id}
            </span>
            {factory.warehouseLabel}
            <ChevronsUpDown className="size-4 text-muted-foreground" />
          </Link>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            <RefreshCw className="size-4 text-muted-foreground" />
            <span className="hidden sm:inline">동기화</span>
          </button>
        </div>
      </div>
    </header>
  )
}
