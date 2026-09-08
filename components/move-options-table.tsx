"use client"

import type { SkuRow } from "@/lib/inventory-data"
import {
  computeMoveOptions,
  bestMoveOption,
  VERDICT_LABEL,
  formatMin,
  formatPayback,
  type GradeResult,
  type MoveOption,
  type MoveVerdict,
} from "@/lib/reslotting"
import { useReslotting } from "@/components/reslotting-context"

const VERDICT_STYLE: Record<MoveVerdict, string> = {
  recommend: "border-primary/40 bg-primary/15 text-primary",
  review: "border-warning/40 bg-warning/15 text-warning",
  reject: "border-border bg-muted text-muted-foreground",
}

function Metric({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div
        className={`font-mono text-xs font-semibold tabular-nums ${
          accent ? "text-primary" : "text-foreground"
        }`}
      >
        {value}
      </div>
    </div>
  )
}

function OptionRow({
  opt,
  isBest,
}: {
  opt: MoveOption
  isBest: boolean
}) {
  return (
    <div
      className={`rounded-lg border p-3 ${
        isBest ? "border-primary/50 bg-primary/5" : "border-border bg-secondary/30"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{opt.label}</span>
          <span className="font-mono text-xs text-muted-foreground">
            {opt.fromLabel}
            <span aria-hidden className="mx-1 text-primary">
              →
            </span>
            {opt.toLabel}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {isBest && (
            <span className="inline-flex items-center rounded border border-primary/40 bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
              추천
            </span>
          )}
          <span
            className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[11px] font-semibold ${VERDICT_STYLE[opt.verdict]}`}
          >
            {VERDICT_LABEL[opt.verdict]}
          </span>
        </div>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{opt.desc}</p>
      <div className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-5">
        <Metric label="재취급" value={`${opt.rehandlePallets}팔레트`} />
        <Metric label="총 소요" value={formatMin(opt.totalMoveSec)} />
        <Metric label="일일 절감" value={formatMin(opt.dailySavedSec)} />
        <Metric label="Payback" value={formatPayback(opt.paybackDays)} />
        <Metric
          label="순이득"
          value={formatMin(opt.netGainSec, true)}
          accent={opt.netGainSec > 0}
        />
      </div>
    </div>
  )
}

export function MoveOptionsTable({
  row,
  grade,
}: {
  row: SkuRow
  grade: GradeResult
}) {
  const { moveParams } = useReslotting()
  const options = computeMoveOptions(row, grade, moveParams)
  const best = bestMoveOption(options)
  const allRejected = best === null

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h4 className="text-sm font-semibold text-foreground">재배치 옵션 3안 비교</h4>
        <p className="mt-0.5 text-xs text-muted-foreground">
          4방향 셔틀 기준 대안별 비용·이득 비교 · 가장 유리한 안에 추천 배지
        </p>
      </div>

      <div className="space-y-2.5 p-4">
        {options.map((opt) => (
          <OptionRow key={opt.id} opt={opt} isBest={!allRejected && best?.id === opt.id} />
        ))}

        {allRejected && (
          <div className="rounded-lg border border-success/40 bg-success/10 px-3 py-2.5 text-sm font-medium text-success">
            세 대안 모두 이동 비용 대비 효과가 없습니다 — 현 위치 유지가 유리합니다.
          </div>
        )}
      </div>
    </div>
  )
}
