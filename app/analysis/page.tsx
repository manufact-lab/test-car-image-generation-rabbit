import Link from "next/link"
import { Boxes, ArrowLeft } from "lucide-react"
import { AnalysisFlow } from "@/components/analysis/analysis-flow"

export default function AnalysisPage() {
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
              <p className="text-xs text-muted-foreground">데이터 분석</p>
            </div>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />홈
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-6">
          <p className="text-sm font-medium uppercase tracking-widest text-primary">
            2. 데이터 분석
          </p>
          <h1 className="mt-2 text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            출하 데이터 분석
          </h1>
          <p className="mt-2 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground">
            창고 최적화에 앞서, 실제 출하 이력을 분석해 SKU 등급·출하 패턴·생산-출하 GAP을 진단합니다.
            분석이 끝나면 최적화 대시보드로 이동할 수 있습니다.
          </p>
        </div>

        <AnalysisFlow />
      </main>
    </div>
  )
}
