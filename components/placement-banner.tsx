import { Sparkles, RefreshCw } from "lucide-react"
import {
  assessCapacity,
  ZONE_PLAN,
  GRADE_COLOR,
  GRADE_LABEL,
} from "@/lib/placement"
import { DEFAULT_WAREHOUSE_SPEC, type WarehouseSpec } from "@/lib/inventory-data"

// 대시보드 상단: 분석 기반 초기 배치가 적용됐음을 알리고, 이후 주문 변동에 따라
// 계속 재최적화된다는 점을 명시한다. 배치 설계 단계에서 넘어온 규격을 반영한다.
export function PlacementBanner({ spec }: { spec?: Partial<WarehouseSpec> }) {
  const defined = Object.fromEntries(
    Object.entries(spec ?? {}).filter(([, v]) => v !== undefined),
  )
  const merged: WarehouseSpec = { ...DEFAULT_WAREHOUSE_SPEC, ...defined }
  const cap = assessCapacity(merged)

  return (
    <section className="mb-6 rounded-xl border border-primary/30 bg-primary/5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Sparkles className="size-4.5" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">분석 기반 초기 배치 적용됨</p>
            <p className="text-xs text-muted-foreground">
              2026년 3~4월 출하 데이터 · 총 {cap.totalCells.toLocaleString()} PLT (필요{" "}
              {cap.required.toLocaleString()} PLT 충족) · 통로 {merged.aisleCount} · {merged.baysPerRow}열 ×{" "}
              {merged.levels}단 · {merged.laneDepth} Deep
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
          <RefreshCw className="size-3.5" aria-hidden />
          주문 변동 시 자동 재최적화
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {ZONE_PLAN.map((z) => (
          <div
            key={z.grade}
            className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2.5"
          >
            <span
              className="flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-bold text-primary-foreground"
              style={{ backgroundColor: GRADE_COLOR[z.grade] }}
            >
              {z.grade}
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-foreground">
                {GRADE_LABEL[z.grade]} · {z.depthBand}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {z.sku} SKU · 출하 {z.shipmentPct}% · {z.access}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
