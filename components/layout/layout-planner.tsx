"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  Building2,
  Boxes,
  CheckCircle2,
  TriangleAlert,
  ArrowRight,
  Layers3,
} from "lucide-react"
import {
  DEFAULT_WAREHOUSE_SPEC,
  type WarehouseSpec,
} from "@/lib/inventory-data"
import {
  assessCapacity,
  autoArrange,
  ZONE_PLAN,
  GRADE_COLOR,
  GRADE_LABEL,
  type PlacementGrade,
} from "@/lib/placement"
import { STORAGE_SIZING } from "@/lib/analysis-data"
import { RackBlockBuilder } from "./rack-block-builder"

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
  { key: "aisleCount", label: "통로 수", hint: "랙 행 = 통로 + 1", min: 1, max: 24, unit: "개" },
  { key: "baysPerRow", label: "베이(열) 수", hint: "한 랙 행의 레인 열 개수", min: 1, max: 24, unit: "열" },
  { key: "levels", label: "레벨(단) 수", hint: "베이당 상하 단 수", min: 1, max: 8, unit: "단" },
  { key: "laneDepth", label: "레인 깊이(Depth)", hint: "레인당 이어지는 위치 수", min: 2, max: 12, unit: "칸" },
  { key: "palletCapacity", label: "팔레트당 적재량", hint: "셀 용량 환산 기준", min: 12, max: 120, step: 4, unit: "EA" },
]

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
          {field.unit ? (
            <span className="ml-0.5 text-xs text-muted-foreground">{field.unit}</span>
          ) : null}
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

export function LayoutPlanner() {
  const [spec, setSpec] = useState<WarehouseSpec>(DEFAULT_WAREHOUSE_SPEC)
  const [grid, setGrid] = useState<PlacementGrade[][]>(() =>
    autoArrange(DEFAULT_WAREHOUSE_SPEC.levels, DEFAULT_WAREHOUSE_SPEC.baysPerRow),
  )

  const cap = useMemo(() => assessCapacity(spec), [spec])

  const setField = (key: NumField["key"], v: number) => {
    setSpec((s) => {
      const next = { ...s, [key]: v }
      if (key === "levels" || key === "baysPerRow") {
        setGrid(autoArrange(next.levels, next.baysPerRow))
      }
      return next
    })
  }

  const paint = (level: number, bay: number, nextGrade: PlacementGrade) => {
    setGrid((g) => {
      const rowIdx = spec.levels - level
      return g.map((row, r) =>
        r === rowIdx ? row.map((cell, b) => (b === bay ? nextGrade : cell)) : row,
      )
    })
  }

  const dashUrl = `/optimizer?opt=1&aisles=${spec.aisleCount}&bays=${spec.baysPerRow}&levels=${spec.levels}&depth=${spec.laneDepth}&pallet=${spec.palletCapacity}`

  return (
    <div className="flex flex-col gap-6">
      {/* 브라운필드 안내 */}
      <div className="flex items-start gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Building2 className="size-5" aria-hidden />
        </span>
        <div>
          <p className="text-sm font-semibold text-foreground">브라운필드 전용 · 기존 창고 배치 설계</p>
          <p className="mt-1 text-pretty text-xs leading-relaxed text-muted-foreground">
            랙 규격을 입력하면 등급별 배치 위치를 자동으로 산출합니다.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1.15fr]">
        {/* 규격 키인 */}
        <section className="rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border px-5 py-4">
            <Layers3 className="size-4 text-primary" aria-hidden />
            <div>
              <h2 className="text-sm font-semibold text-foreground">4-way shuttle 규격 입력</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                기존 설치 랙의 실제 규격을 입력하세요
              </p>
            </div>
          </div>
          <div className="space-y-5 px-5 py-4">
            {NUM_FIELDS.map((f) => (
              <SliderRow key={f.key} field={f} value={spec[f.key]} onChange={(v) => setField(f.key, v)} />
            ))}
          </div>
        </section>

        {/* 용량 적정성 */}
        <section className="rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border px-5 py-4">
            <Boxes className="size-4 text-primary" aria-hidden />
            <h2 className="text-sm font-semibold text-foreground">규격 산출 · 필요 보관량 대비</h2>
          </div>
          <div className="space-y-4 px-5 py-4">
            <div className="grid grid-cols-3 gap-2">
              <MiniStat label="랙 행" value={`${cap.rackRows}행`} />
              <MiniStat label="총 레인" value={cap.totalLanes.toLocaleString()} />
              <MiniStat label="총 셀(PLT)" value={cap.totalCells.toLocaleString()} />
            </div>

            {/* 필요 보관량 대비 게이지 */}
            <div>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  필요 보관량 {STORAGE_SIZING.requiredPlt.toLocaleString()} PLT 대비
                </span>
                <span className="font-mono font-medium text-foreground">
                  {cap.totalCells.toLocaleString()} PLT 확보
                </span>
              </div>
              <div
                className="h-3 w-full overflow-hidden rounded-full bg-secondary"
                role="progressbar"
                aria-valuenow={Math.min(100, cap.fillPct)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className={`h-full rounded-full transition-all ${cap.ok ? "bg-primary" : "bg-destructive"}`}
                  style={{ width: `${Math.min(100, cap.fillPct)}%` }}
                />
              </div>
            </div>

            {cap.ok ? (
              <div className="flex items-start gap-2 rounded-lg border border-success/40 bg-success/10 p-3">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                <p className="text-xs leading-relaxed text-foreground">
                  용량 충족 · 필요 보관량 {STORAGE_SIZING.requiredPlt.toLocaleString()} PLT 대비{" "}
                  <span className="font-semibold text-success">
                    +{cap.surplus.toLocaleString()} PLT
                  </span>{" "}
                  여유. 충분히 수용 가능합니다.
                </p>
              </div>
            ) : (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3">
                <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
                <p className="text-xs leading-relaxed text-foreground">
                  용량 부족 · 필요 보관량 대비{" "}
                  <span className="font-semibold text-destructive">
                    {cap.surplus.toLocaleString()} PLT
                  </span>{" "}
                  부족합니다. 규격을 늘려주세요.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="rounded-lg border border-primary/40 bg-primary/5 p-2.5">
                <div className="font-mono text-sm font-semibold text-foreground">
                  {cap.twoSidedLanes.toLocaleString()}
                </div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">양면 레인</div>
              </div>
              <div className="rounded-lg border border-warning/40 bg-warning/5 p-2.5">
                <div className="font-mono text-sm font-semibold text-foreground">
                  {cap.oneSidedLanes.toLocaleString()}
                </div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">단면 레인</div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* 블록 빌더 */}
      <RackBlockBuilder
        grid={grid}
        levels={spec.levels}
        bays={spec.baysPerRow}
        onPaint={paint}
        onAuto={() => setGrid(autoArrange(spec.levels, spec.baysPerRow))}
      />

      {/* 분석 기반 최적 배치 결과 */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-foreground">등급별 배치 결과</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {ZONE_PLAN.map((z) => (
            <div key={z.grade} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
              <span
                className="inline-flex w-fit items-center rounded-md px-2 py-1 text-xs font-bold text-primary-foreground"
                style={{ backgroundColor: GRADE_COLOR[z.grade] }}
              >
                {GRADE_LABEL[z.grade]}
              </span>
              <div className="flex items-baseline gap-1">
                <span className="font-mono text-3xl font-semibold tabular-nums text-foreground">
                  {z.shipmentPct}
                </span>
                <span className="text-sm text-muted-foreground">% 출하</span>
                <span className="ml-auto font-mono text-xs tabular-nums text-muted-foreground">
                  {z.sku} SKU
                </span>
              </div>
              <p className="text-pretty text-sm leading-relaxed text-foreground">
                {z.depthBand} · {z.level}에 배치합니다.
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center">
        <p className="text-sm font-medium text-foreground">이 배치로 확정하고 공장에 적용합니다.</p>
        {cap.ok ? (
          <Link
            href={dashUrl}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            최적 배치 적용 · 공장 적용으로
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        ) : (
          <span className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg bg-secondary px-5 py-2.5 text-sm font-semibold text-muted-foreground">
            용량 부족 · 규격을 조정하세요
          </span>
        )}
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
