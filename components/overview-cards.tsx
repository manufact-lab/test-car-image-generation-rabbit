"use client"

import { Boxes, Package, Timer, Shuffle } from "lucide-react"
import { daysOfSupply } from "@/lib/inventory-data"
import { useReslotting } from "@/components/reslotting-context"

function CardShell({
  title,
  icon,
  children,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <span className="flex size-8 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
          {icon}
        </span>
      </div>
      {children}
    </div>
  )
}

export function OverviewCards() {
  const { rows, candidates, pendingCount, factory } = useReslotting()

  const fillPct = Math.round(
    (factory.usedPallets / factory.totalPallets) * 100,
  )

  const skuCount = rows.length
  const avgDos =
    rows.reduce((acc, r) => {
      const d = daysOfSupply(r)
      return acc + (Number.isFinite(d) ? d : 0)
    }, 0) / rows.length

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <CardShell title="전체 보관량 (Total Capacity)" icon={<Boxes className="size-4" />}>
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-3xl font-semibold tabular-nums text-foreground">
            {factory.usedPallets.toLocaleString()}
          </span>
          <span className="text-sm text-muted-foreground">
            / {factory.totalPallets.toLocaleString()} Pallets
          </span>
        </div>
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">충진율</span>
            <span className="font-mono font-medium text-primary">{fillPct}%</span>
          </div>
          <div
            className="h-2.5 w-full overflow-hidden rounded-full bg-secondary"
            role="progressbar"
            aria-valuenow={fillPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="창고 충진율"
          >
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${fillPct}%` }}
            />
          </div>
        </div>
      </CardShell>

      <CardShell title="총 관리 SKU 수량 (Total SKU)" icon={<Package className="size-4" />}>
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-3xl font-semibold tabular-nums text-foreground">
            {factory.totalSkuCount.toLocaleString()}
          </span>
          <span className="text-sm text-muted-foreground">Items</span>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          모니터링 중 <span className="font-medium text-foreground">{skuCount}</span> SKU · 전월 대비{" "}
          <span className="font-medium text-primary">+12</span> 신규 등록
        </p>
      </CardShell>

      <CardShell title="평균 재고보유 일수 (Avg. DoS)" icon={<Timer className="size-4" />}>
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-3xl font-semibold tabular-nums text-foreground">
            {avgDos.toFixed(1)}
          </span>
          <span className="text-sm text-muted-foreground">Days</span>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          목표 범위 <span className="font-medium text-foreground">7–14일</span> · 위험 구간 SKU{" "}
          <span className="font-medium text-destructive">
            {rows.filter((r) => daysOfSupply(r) <= 3).length}건
          </span>
        </p>
      </CardShell>

      <CardShell title="리슬롯팅 대기 (Reslotting)" icon={<Shuffle className="size-4" />}>
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-3xl font-semibold tabular-nums text-foreground">
            {pendingCount}
          </span>
          <span className="text-sm text-muted-foreground">
            / {candidates.length} 후보
          </span>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Cross-ABC 재평가 결과 승인 대기{" "}
          <span className="font-medium text-warning">{pendingCount}건</span> · 큐 탭에서 검토
        </p>
      </CardShell>
    </section>
  )
}
