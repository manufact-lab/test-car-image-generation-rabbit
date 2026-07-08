import { Boxes, RefreshCw, ChevronDown } from "lucide-react"

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Boxes className="size-5" aria-hidden="true" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-foreground">ShuttleIQ</p>
            <p className="text-xs text-muted-foreground">
              Warehouse Inventory Optimizer
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="hidden items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary sm:inline-flex"
          >
            창고 A-01
            <ChevronDown className="size-4 text-muted-foreground" />
          </button>
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
