import Link from "next/link"
import { Boxes, ArrowRight, Package, Layers } from "lucide-react"
import { FACTORY_LIST } from "@/lib/inventory-data"

export default function FactorySelectPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center gap-2.5 px-4 py-4 sm:px-6">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Boxes className="size-5" aria-hidden="true" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-foreground">ShuttleIQ</p>
            <p className="text-xs text-muted-foreground">Warehouse Inventory Optimizer</p>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 py-12 sm:px-6">
        <div className="mb-8">
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground">
            공장 선택
          </h1>
          <p className="mt-2 text-pretty text-sm text-muted-foreground">
            관리할 공장을 선택하세요. 각 공장은 동일한 최적화 대시보드를 사용하며 SKU 재고량과 보관량이 다릅니다.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {FACTORY_LIST.map((factory) => {
            const fillPct = Math.round(
              (factory.usedPallets / factory.totalPallets) * 100,
            )
            return (
              <Link
                key={factory.id}
                href={`/factory/${factory.id}`}
                className="group rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/50 hover:bg-secondary/40"
              >
                <div className="flex items-start justify-between">
                  <span className="flex size-14 items-center justify-center rounded-xl bg-primary/15 font-mono text-2xl font-bold text-primary">
                    {factory.id}
                  </span>
                  <ArrowRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                </div>

                <h2 className="mt-5 text-xl font-semibold text-foreground">{factory.name}</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {factory.country} · {factory.warehouseLabel}
                </p>

                <dl className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border bg-background/50 p-3">
                    <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Package className="size-3.5" aria-hidden="true" />
                      관리 SKU
                    </dt>
                    <dd className="mt-1 font-mono text-lg font-semibold tabular-nums text-foreground">
                      {factory.totalSkuCount.toLocaleString()}
                    </dd>
                  </div>
                  <div className="rounded-lg border border-border bg-background/50 p-3">
                    <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Layers className="size-3.5" aria-hidden="true" />
                      충진율
                    </dt>
                    <dd className="mt-1 font-mono text-lg font-semibold tabular-nums text-foreground">
                      {fillPct}%
                    </dd>
                  </div>
                </dl>

                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {factory.usedPallets.toLocaleString()} /{" "}
                      {factory.totalPallets.toLocaleString()} Pallets
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${fillPct}%` }}
                    />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </main>
    </div>
  )
}
