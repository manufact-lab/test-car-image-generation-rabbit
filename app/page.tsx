import { DashboardHeader } from "@/components/dashboard-header"
import { OverviewCards } from "@/components/overview-cards"
import { InventoryTable } from "@/components/inventory-table"
import { AiOptimizer } from "@/components/ai-optimizer"
import { SlottingAlert } from "@/components/slotting-alert"

export default function Page() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6">
          <h1 className="text-balance text-2xl font-semibold tracking-tight text-foreground">
            재고 최적화 대시보드
          </h1>
          <p className="mt-1 text-pretty text-sm text-muted-foreground">
            자동차 부품 SKU · 차종 매핑과 재고 일수(Days of Supply) 기반 생산 · 4-Way 셔틀 적재 전략
          </p>
        </div>

        <OverviewCards />

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
          <InventoryTable />
          <AiOptimizer />
        </div>
      </main>

      <SlottingAlert />
    </div>
  )
}
