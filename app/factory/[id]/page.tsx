import { notFound } from "next/navigation"
import { getFactory, FACTORY_LIST } from "@/lib/inventory-data"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardTabs } from "@/components/dashboard-tabs"
import { ReslottingProvider } from "@/components/reslotting-context"

export function generateStaticParams() {
  return FACTORY_LIST.map((f) => ({ id: String(f.id) }))
}

export default async function FactoryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const factory = getFactory(Number(id))
  if (!factory) notFound()

  return (
    <ReslottingProvider factory={factory}>
      <div className="min-h-screen bg-background">
        <DashboardHeader factory={factory} />

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
          <div className="mb-6">
            <h1 className="text-balance text-2xl font-semibold tracking-tight text-foreground">
              {factory.name} 재고 최적화 대시보드
            </h1>
            <p className="mt-1 text-pretty text-sm text-muted-foreground">
              {factory.warehouseLabel} · 자동차 도어트림 SKU · 재고 일수(Days of Supply) 기반 생산 · 4-Way
              셔틀 적재 전략
            </p>
          </div>

          <DashboardTabs />
        </main>
      </div>
    </ReslottingProvider>
  )
}
