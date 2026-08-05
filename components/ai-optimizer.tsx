"use client"

import { Sparkles, ArrowRight } from "lucide-react"
import { useReslotting } from "@/components/reslotting-context"
import { classifySlot, GRADE_DEPTH_LABEL, type SlotGrade } from "@/lib/reslotting"

const TIER_META: Record<
  SlotGrade,
  { title: string; blurb: string; accent: string }
> = {
  S: {
    title: "S급 · 초고빈도",
    blurb: "레인 최전면(1-Deep) 배치로 피킹 최속화",
    accent: "text-primary",
  },
  A: {
    title: "A급 · 고빈도 출하",
    blurb: "통로 인접, 간섭 최소 구역 배치",
    accent: "text-primary",
  },
  B: {
    title: "B급 · 중간 회전",
    blurb: "완충 구역 배치로 접근성·밀도 균형",
    accent: "text-warning",
  },
  C: {
    title: "C급 · 저빈도 출하",
    blurb: "보관 효율 극대화 밀집 구역 배치",
    accent: "text-success",
  },
}

const ORDER: SlotGrade[] = ["S", "A", "B", "C"]

export function AiOptimizer() {
  const { rows, thresholds } = useReslotting()

  const groups: Record<SlotGrade, number> = { S: 0, A: 0, B: 0, C: 0 }
  for (const row of rows) groups[classifySlot(row, thresholds).finalGrade] += 1

  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="flex items-start gap-3 border-b border-border p-5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Sparkles className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-foreground">
            AI 4-Way 셔틀 적재 전략
          </h2>
          <p className="text-pretty text-sm text-muted-foreground">
            물량과 피킹 빈도를 교차(Cross-ABC) 분석해 셔틀 적재 깊이(Depth)를 추천합니다.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 p-5">
        {ORDER.map((cls) => {
          const meta = TIER_META[cls]
          return (
            <div
              key={cls}
              className="rounded-lg border border-border bg-secondary/40 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className={`flex size-7 shrink-0 items-center justify-center rounded-md bg-background font-mono text-sm font-bold ${meta.accent}`}
                  >
                    {cls}
                  </span>
                  <div className="min-w-0">
                    <p className="whitespace-nowrap text-sm font-medium text-foreground">
                      {meta.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{meta.blurb}</p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="whitespace-nowrap font-mono text-sm font-semibold text-foreground">
                    {GRADE_DEPTH_LABEL[cls]}
                  </p>
                  <p className="whitespace-nowrap text-xs text-muted-foreground">
                    {groups[cls]} SKU
                  </p>
                </div>
              </div>
            </div>
          )
        })}

        <button
          type="button"
          className="mt-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          최적 슬로팅 플랜 적용
          <ArrowRight className="size-4" aria-hidden="true" />
        </button>
      </div>
    </section>
  )
}
