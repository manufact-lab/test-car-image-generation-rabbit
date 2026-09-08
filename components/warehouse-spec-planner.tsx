"use client"

import { useMemo, useState } from "react"
import { Building2, LayoutGrid, TriangleAlert, CheckCircle2 } from "lucide-react"
import {
  DEFAULT_WAREHOUSE_SPEC,
  WALL_ADJACENCY_LABEL,
  computeWarehouseSpec,
  checkOneSidedFit,
  LANE_ACCESS_LABEL,
  type WarehouseSpec,
  type WallAdjacency,
} from "@/lib/inventory-data"
import { useReslotting } from "@/components/reslotting-context"

type NumField = {
  key: keyof Pick<
    WarehouseSpec,
    "aisleCount" | "baysPerRow" | "levels" | "laneDepth" | "palletCapacity"
  >
  label: string
  hint: string
  min: number
  max: number
  step?: number
  unit?: string
}

const NUM_FIELDS: NumField[] = [
  { key: "aisleCount", label: "통로 수", hint: "랙 행 = 통로 + 1", min: 1, max: 20, unit: "개" },
  { key: "baysPerRow", label: "랙 행당 베이 수", hint: "한 랙 행의 레인 열 개수", min: 1, max: 20, unit: "베이" },
  { key: "levels", label: "레벨(단) 수", hint: "베이당 상하 레벨 수", min: 1, max: 8, unit: "단" },
  { key: "laneDepth", label: "레인 깊이", hint: "레인당 팔레트 위치 수", min: 2, max: 10, unit: "칸" },
  { key: "palletCapacity", label: "팔레트당 적재량", hint: "레인 용량(EA) 환산 기준", min: 12, max: 120, step: 4, unit: "EA" },
]

const WALL_OPTIONS: WallAdjacency[] = ["both", "one", "none"]

function SliderRow({
  field,
  value,
  onChange,
}: {
  field: NumField
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label htmlFor={field.key} className="text-sm font-medium text-foreground">
          {field.label}
        </label>
        <span className="font-mono text-sm tabular-nums text-primary">
          {value}
          {field.unit ? <span className="ml-0.5 text-xs text-muted-foreground">{field.unit}</span> : null}
        </span>
      </div>
      <input
        id={field.key}
        type="range"
        min={field.min}
        max={field.max}
        step={field.step ?? 1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
      />
      <p className="mt-0.5 text-xs text-muted-foreground">{field.hint}</p>
    </div>
  )
}

function CapacityStat({
  label,
  lanes,
  pallets,
  ea,
  tone,
}: {
  label: string
  lanes: number
  pallets: number
  ea: number
  tone: "two" | "one"
}) {
  return (
    <div
      className={`rounded-lg border p-3 ${
        tone === "two" ? "border-primary/40 bg-primary/5" : "border-warning/40 bg-warning/5"
      }`}
    >
      <div className="flex items-center gap-1.5">
        <span
          className={`size-2 rounded-[3px] ${tone === "two" ? "bg-primary" : "bg-warning"}`}
          aria-hidden
        />
        <span className="text-xs font-semibold text-foreground">{label}</span>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="font-mono text-sm font-semibold tabular-nums text-foreground">
            {lanes.toLocaleString()}
          </div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">레인</div>
        </div>
        <div>
          <div className="font-mono text-sm font-semibold tabular-nums text-foreground">
            {pallets.toLocaleString()}
          </div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">팔레트</div>
        </div>
        <div>
          <div className="font-mono text-sm font-semibold tabular-nums text-foreground">
            {ea.toLocaleString()}
          </div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">EA</div>
        </div>
      </div>
    </div>
  )
}

export function WarehouseSpecPlanner() {
  const [spec, setSpec] = useState<WarehouseSpec>(DEFAULT_WAREHOUSE_SPEC)
  const result = useMemo(() => computeWarehouseSpec(spec), [spec])

  const { rows, factory } = useReslotting()

  // 현재 공장 배치 진단: 단면 레인에 있는 SKU의 적합/위험 판정
  const diagnostics = useMemo(() => {
    const oneSided = rows.filter((r) => r.location.laneAccess === "one-sided")
    return oneSided.map((r) => ({ row: r, fit: checkOneSidedFit(r, spec.palletCapacity) }))
  }, [rows, spec.palletCapacity])

  const riskCount = diagnostics.filter((d) => !d.fit.ok).length
  const twoSidedPct =
    result.totalPallets > 0 ? Math.round((result.twoSidedPallets / result.totalPallets) * 100) : 0

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1.2fr]">
      {/* 입력 */}
      <section className="rounded-xl border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border px-5 py-4">
          <Building2 className="size-4 text-primary" aria-hidden />
          <div>
            <h2 className="text-sm font-semibold text-foreground">창고 설계 스펙 입력</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              통로 수와 벽면 접합을 입력하면 단면/양면 레인과 용량을 산출합니다
            </p>
          </div>
        </div>

        <div className="space-y-5 px-5 py-4">
          <div>
            <div className="mb-1.5 text-sm font-medium text-foreground">벽면 접합 여부</div>
            <div
              role="radiogroup"
              aria-label="벽면 접합 여부"
              className="inline-flex flex-wrap gap-1 rounded-lg border border-border bg-secondary/40 p-1"
            >
              {WALL_OPTIONS.map((w) => {
                const active = spec.wallAdjacency === w
                return (
                  <button
                    key={w}
                    role="radio"
                    aria-checked={active}
                    onClick={() => setSpec((s) => ({ ...s, wallAdjacency: w }))}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {WALL_ADJACENCY_LABEL[w]}
                  </button>
                )
              })}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              벽에 접한 양 끝단 랙 행이 단면(한쪽 접근) 레인이 됩니다.
            </p>
          </div>

          {NUM_FIELDS.map((f) => (
            <SliderRow
              key={f.key}
              field={f}
              value={spec[f.key]}
              onChange={(v) => setSpec((s) => ({ ...s, [f.key]: v }))}
            />
          ))}
        </div>
      </section>

      {/* 산출 결과 */}
      <div className="flex flex-col gap-6">
        <section className="rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border px-5 py-4">
            <LayoutGrid className="size-4 text-primary" aria-hidden />
            <h2 className="text-sm font-semibold text-foreground">배치 가능 용량 산출</h2>
          </div>

          <div className="space-y-4 px-5 py-4">
            <div className="grid grid-cols-3 gap-2">
              <MiniStat label="랙 행" value={`${result.rackRows}행`} />
              <MiniStat label="양면 행" value={`${result.twoSidedRows}행`} />
              <MiniStat label="단면 행" value={`${result.oneSidedRows}행`} />
            </div>

            {/* 용량 비중 바 */}
            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>총 {result.totalPallets.toLocaleString()} 팔레트</span>
                <span>양면 {twoSidedPct}%</span>
              </div>
              <div className="flex h-3 w-full overflow-hidden rounded-full border border-border bg-secondary/40">
                <div className="bg-primary" style={{ width: `${twoSidedPct}%` }} aria-hidden />
                <div className="bg-warning" style={{ width: `${100 - twoSidedPct}%` }} aria-hidden />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <CapacityStat
                label={`${LANE_ACCESS_LABEL["two-sided"]} 레인`}
                lanes={result.twoSidedLanes}
                pallets={result.twoSidedPallets}
                ea={result.twoSidedEa}
                tone="two"
              />
              <CapacityStat
                label={`${LANE_ACCESS_LABEL["one-sided"]} 레인`}
                lanes={result.oneSidedLanes}
                pallets={result.oneSidedPallets}
                ea={result.oneSidedEa}
                tone="one"
              />
            </div>

            <p className="text-[11px] leading-relaxed text-muted-foreground">
              단면 레인({result.oneSidedLanes.toLocaleString()}개)에는 1회 입고 로트가 레인 용량 이상이거나
              FIFO 관리가 불요한 SKU만 배치해야 구조적 LIFO로 인한 재고 정체를 피할 수 있습니다.
            </p>
          </div>
        </section>

        {/* 현재 배치 진단 */}
        <section className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold text-foreground">
              단면 레인 배치 진단 · {factory.name}
            </h2>
            {riskCount > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-md border border-destructive/40 bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
                <TriangleAlert className="size-3.5" aria-hidden />
                위험 {riskCount}건
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md border border-success/40 bg-success/10 px-2 py-0.5 text-xs font-semibold text-success">
                <CheckCircle2 className="size-3.5" aria-hidden />
                적합
              </span>
            )}
          </div>

          <ul className="divide-y divide-border">
            {diagnostics.length === 0 && (
              <li className="px-5 py-6 text-center text-sm text-muted-foreground">
                단면 레인에 배치된 SKU가 없습니다.
              </li>
            )}
            {diagnostics.map(({ row, fit }) => (
              <li key={row.skuId} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-foreground">
                      {row.skuId}
                    </span>
                    <span className="rounded border border-warning/40 bg-warning/10 px-1.5 py-0.5 text-[10px] font-medium text-warning">
                      {row.location.aisle} · 단면
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    로트 {row.incomingLotSize.toLocaleString()} EA / 레인용량{" "}
                    {fit.laneCapacity.toLocaleString()} EA · FIFO{" "}
                    {row.fifoRequired ? "필요" : "불요"}
                  </p>
                </div>
                {fit.ok ? (
                  <span className="inline-flex items-center gap-1 rounded-md border border-success/40 bg-success/10 px-2 py-1 text-xs font-medium text-success">
                    <CheckCircle2 className="size-3.5" aria-hidden />
                    적합 {fit.lotCoversLane ? "(①)" : "(②)"}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-md border border-destructive/40 bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive">
                    <TriangleAlert className="size-3.5" aria-hidden />
                    FIFO 위험 → 양면 이동
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-secondary/40 px-3 py-2 text-center">
      <div className="font-mono text-sm font-semibold text-foreground">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  )
}
