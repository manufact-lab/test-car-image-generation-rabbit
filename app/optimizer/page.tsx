import Link from "next/link"
import { Boxes, ArrowRight, ArrowLeft, Package, Layers, Sparkles } from "lucide-react"
import { FACTORY_LIST } from "@/lib/inventory-data"
import { WorkflowStepper } from "@/components/workflow-stepper"

export default async function FactorySelectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const optimized = sp.opt === "1"
  const keys = ["opt", "aisles", "bays", "levels", "depth", "pallet"] as const
  const qs = keys
    .map((k) => (typeof sp[k] === "string" ? `${k}=${sp[k]}` : ""))
    .filter(Boolean)
    .join("&")
  const suffix = qs ? `?${qs}` : ""

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2.5 px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Boxes className="size-5" aria-hidden="true" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-foreground">ShuttleIQ</p>
              <p className="text-xs text-muted-foreground">Warehouse Inventory Optimizer</p>
            </div>
          </Link>
          <Link
            href={optimized ? "/analysis/layout" : "/"}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            {optimized ? "브라운필드로" : "홈"}
          </Link>
        </div>
      </header>
      <WorkflowStepper current={4} />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 py-12 sm:px-6">
        <div className="mb-8">
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground">
            {optimized ? "최적화할 공장 선택" : "공장 선택"}
          </h1>
          <p className="mt-2 text-pretty text-sm text-muted-foreground">
            {optimized
              ? "브라운필드 최적 배치를 적용할 공장을 선택하세요. 선택한 공장의 대시보드가 해당 배치로 세팅됩니다."
              : "관리할 공장을 선택하세요. 각 공장은 동일한 최적화 대시보드를 사용하며 SKU 재고량과 보관량이 다릅니다."}
          </p>
          {optimized && (
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-primary/30 bg-primary/5 p-4">
              <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Sparkles className="size-4" aria-hidden="true" />
              </span>
              <p className="text-pretty text-sm leading-relaxed text-foreground">
                분석 기반 최적 배치가 준비되었습니다. 공장을 선택하면 해당 배치가 대시보드 초기 상태로 적용됩니다.
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {FACTORY_LIST.map((factory) => {
            const fillPct = Math.round(
              (factory.usedPallets / factory.totalPallets) * 100,
            )
            return (
              <Link
                key={factory.id}
                href={`/factory/${factory.id}${suffix}`}
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
