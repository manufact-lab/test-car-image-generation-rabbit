import Link from "next/link"
import { Boxes, ArrowLeft } from "lucide-react"
import { AnalysisWorkspace } from "@/components/analysis/analysis-workspace"

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

      <AnalysisWorkspace />
    </div>
  )
}
