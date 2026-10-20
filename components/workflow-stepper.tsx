import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export const WORKFLOW_STEPS = [
  { id: 1, label: "데이터 입력", description: "출하 데이터 업로드" },
  { id: 2, label: "데이터 분석", description: "등급·GAP 진단" },
  { id: 3, label: "설계 반영", description: "브라운필드 배치" },
  { id: 4, label: "공장 적용", description: "적용 공장 선택" },
  { id: 5, label: "최적화", description: "대시보드 운영" },
] as const

export type WorkflowStepId = (typeof WORKFLOW_STEPS)[number]["id"]

export function WorkflowStepper({
  current,
  className,
}: {
  current: WorkflowStepId
  className?: string
}) {
  const total = WORKFLOW_STEPS.length
  const currentStep = WORKFLOW_STEPS[current - 1]
  const progressPct = ((current - 1) / (total - 1)) * 100

  return (
    <nav aria-label="진행 단계" className={cn("border-b border-border bg-secondary/30", className)}>
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
        {/* 모바일: 현재 단계 요약 + 진행 바 */}
        <div className="sm:hidden">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground">
              <span className="font-mono text-primary">STEP {current}</span> · {currentStep.label}
            </span>
            <span className="font-mono tabular-nums text-muted-foreground">
              {current} / {total}
            </span>
          </div>
          <div
            className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border"
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={total}
            aria-valuenow={current}
            aria-label={`${total}단계 중 ${current}단계`}
          >
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${(current / total) * 100}%` }}
            />
          </div>
        </div>

        {/* 데스크톱: 전체 단계 */}
        <ol className="relative hidden items-start justify-between sm:flex">
          <div aria-hidden="true" className="absolute left-[10%] right-[10%] top-4 h-0.5 bg-border">
            <div className="h-full bg-primary transition-all" style={{ width: `${progressPct}%` }} />
          </div>

          {WORKFLOW_STEPS.map((step) => {
            const status =
              step.id < current ? "complete" : step.id === current ? "current" : "upcoming"
            return (
              <li
                key={step.id}
                aria-current={status === "current" ? "step" : undefined}
                className="relative z-10 flex flex-1 flex-col items-center gap-1.5 text-center"
              >
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full border-2 font-mono text-xs font-semibold transition-colors",
                    status === "complete" && "border-primary bg-primary text-primary-foreground",
                    status === "current" &&
                      "border-primary bg-background text-primary ring-4 ring-primary/15",
                    status === "upcoming" && "border-border bg-background text-muted-foreground",
                  )}
                >
                  {status === "complete" ? (
                    <Check className="size-4" aria-hidden="true" />
                  ) : (
                    step.id
                  )}
                </span>
                <span className="leading-tight">
                  <span
                    className={cn(
                      "block text-xs font-semibold",
                      status === "upcoming" ? "text-muted-foreground" : "text-foreground",
                      status === "current" && "text-primary",
                    )}
                  >
                    {step.label}
                    {status === "complete" && <span className="sr-only"> (완료)</span>}
                    {status === "current" && <span className="sr-only"> (현재 단계)</span>}
                  </span>
                  <span className="hidden text-[11px] text-muted-foreground md:block">
                    {step.description}
                  </span>
                </span>
              </li>
            )
          })}
        </ol>
      </div>
    </nav>
  )
}
