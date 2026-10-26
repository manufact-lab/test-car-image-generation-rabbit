import Link from "next/link"
import { Boxes, ArrowLeft } from "lucide-react"
import { LayoutPlanner } from "@/components/layout/layout-planner"
import { WorkflowStepper } from "@/components/workflow-stepper"

export default function LayoutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2.5 px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Boxes className="size-5" aria-hidden="true" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-foreground">ShuttleIQ</p>
              <p className="text-xs text-muted-foreground">브라운필드 배치 설계</p>
            </div>
          </Link>
          <Link
            href="/analysis"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            분석으로
          </Link>
        </div>
      </header>
      <WorkflowStepper current={3} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            브라운필드 4-way shuttle 배치
          </h1>
          <p className="mt-2 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground">
            기존 창고의 실제 랙 규격을 입력하면 분석 결과에 맞춰 등급별 최적 배치를 산출합니다. 최적 배치를
            적용한 뒤 다음 단계에서 이 배치를 적용할 공장을 선택합니다.
          </p>
        </div>

        <LayoutPlanner />
      </main>
    </div>
  )
}
