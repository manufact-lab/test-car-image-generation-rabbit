"use client"

import { useMemo } from "react"
import { Paintbrush, Wand2 } from "lucide-react"
import {
  type PlacementGrade,
  GRADE_COLOR,
  GRADE_LABEL,
  ZONE_PLAN,
  countGrades,
} from "@/lib/placement"

const CYCLE: Record<PlacementGrade, PlacementGrade> = { A: "B", B: "C", C: "A" }

export function RackBlockBuilder({
  grid,
  levels,
  bays,
  onPaint,
  onAuto,
}: {
  grid: PlacementGrade[][]
  levels: number
  bays: number
  onPaint: (level: number, bay: number, next: PlacementGrade) => void
  onAuto: () => void
}) {
  const counts = useMemo(() => countGrades(grid), [grid])
  const totalCells = levels * bays

  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <Paintbrush className="size-4 text-primary" aria-hidden />
          <div>
            <h2 className="text-sm font-semibold text-foreground">랙 입면 블록 배치</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              블록을 클릭하면 등급이 전환됩니다 (A→B→C) · 대표 랙 행 1개의 단×열 입면
            </p>
          </div>
        </div>
        <button
          onClick={onAuto}
          className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
        >
          <Wand2 className="size-3.5" aria-hidden />
          분석 기반 자동 배치
        </button>
      </div>

      <div className="px-5 py-4">
        {/* 골든존 표시 + 그리드 */}
        <div className="flex gap-2">
          {/* 레벨 라벨 */}
          <div className="flex flex-col justify-between py-0.5 text-[10px] font-medium text-muted-foreground">
            {Array.from({ length: levels }, (_, i) => (
              <span key={i} className="flex h-8 items-center tabular-nums">
                L{levels - i}
              </span>
            ))}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-1.5">
              {grid.map((row, r) => {
                const level = levels - r
                return (
                  <div key={r} className="flex gap-1.5">
                    {row.map((g, b) => (
                      <button
                        key={b}
                        onClick={() => onPaint(level, b, CYCLE[g])}
                        title={`L${level} · 베이 ${b + 1} · ${GRADE_LABEL[g]}`}
                        className="flex h-8 flex-1 items-center justify-center rounded-[4px] text-[11px] font-bold text-primary-foreground transition-transform hover:scale-105"
                        style={{ backgroundColor: GRADE_COLOR[g] }}
                        aria-label={`레벨 ${level} 베이 ${b + 1}, 현재 ${GRADE_LABEL[g]}, 클릭하여 변경`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                )
              })}
            </div>

            {/* 베이(열) 라벨 + 통로 방향 */}
            <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>← 프라임 통로 (얕은 접근)</span>
              <span>후면 →</span>
            </div>
          </div>
        </div>

        {/* 범례 + 배정 현황 */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {ZONE_PLAN.map((z) => {
            const cells = counts[z.grade]
            const pct = totalCells > 0 ? Math.round((cells / totalCells) * 100) : 0
            return (
              <div key={z.grade} className="rounded-lg border border-border bg-background/50 p-2.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className="size-2.5 rounded-[3px]"
                    style={{ backgroundColor: GRADE_COLOR[z.grade] }}
                    aria-hidden
                  />
                  <span className="text-xs font-semibold text-foreground">
                    {GRADE_LABEL[z.grade]}
                  </span>
                </div>
                <div className="mt-1 font-mono text-sm font-semibold tabular-nums text-foreground">
                  {pct}%
                  <span className="ml-1 text-[10px] font-normal text-muted-foreground">
                    {cells}셀 / 목표 {z.targetCellPct}%
                  </span>
                </div>
                <p className="mt-0.5 text-[10px] leading-tight text-muted-foreground">
                  {z.depthBand}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
