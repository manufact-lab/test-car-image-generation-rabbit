import { notFound } from "next/navigation"
import { getFactory, FACTORY_LIST } from "@/lib/inventory-data"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardTabs } from "@/components/dashboard-tabs"
import { ReslottingProvider } from "@/components/reslotting-context"
import { WorkflowStepper } from "@/components/workflow-stepper"

export function generateStaticParams() {
  return FACTORY_LIST.map((f) => ({ id: String(f.id) }))
}

function numParam(v: string | string[] | undefined): number | undefined {
  const s = Array.isArray(v) ? v[0] : v
  const n = s ? Number(s) : NaN
  return Number.isFinite(n) ? n : undefined
}

export default async function FactoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { id } = await params
  const sp = await searchParams
  const factory = getFactory(Number(id))
  if (!factory) notFound()

  const optimized = sp.opt === "1"
  const spec = {
    aisleCount: numParam(sp.aisles),
    baysPerRow: numParam(sp.bays),
    levels: numParam(sp.levels),
    laneDepth: numParam(sp.depth),
    palletCapacity: numParam(sp.pallet),
  }

  return (
    <ReslottingProvider factory={factory}>
      <div className="min-h-screen bg-background">
        <DashboardHeader factory={factory} />
        <WorkflowStepper current={5} />

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
          <div className="mb-6">
            <h1 className="text-balance text-2xl font-semibold tracking-tight text-foreground">
              AI 재고 최적화 · {factory.name}
            </h1>
            <p className="mt-1 text-pretty text-sm text-muted-foreground">
              {factory.warehouseLabel} · 자동차 도어트림 SKU · 재고 일수(Days of Supply) 기반 생산 · 4-Way
              셔틀 적재 전략
            </p>
          </div>

          <DashboardTabs optimized={optimized} spec={spec} />
        </main>
      </div>
    </ReslottingProvider>
  )
}
