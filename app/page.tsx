import Link from "next/link"
import { Boxes, ArrowRight, PackageSearch, Cpu, Clock } from "lucide-react"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center gap-2.5 px-4 py-4 sm:px-6">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Boxes className="size-5" aria-hidden="true" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-foreground">ShuttleIQ</p>
            <p className="text-xs text-muted-foreground">AI Warehouse Platform</p>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 py-12 sm:px-6">
        <div className="mb-10 text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-primary">
            AI 자동창고 플랫폼
          </p>
          <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            무엇을 시작할까요?
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground">
            4-Way 셔틀 자동창고를 위한 AI 기반 도구입니다. 재고 최적화로 슬로팅과 리슬롯팅을 관리하거나,
            창고 시뮬레이션으로 설계안을 검증하세요.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* AI 재고 최적화 — 활성 */}
          <Link
            href="/optimizer"
            className="group relative flex flex-col rounded-2xl border border-border bg-card p-7 transition-colors hover:border-primary/50 hover:bg-secondary/40"
          >
            <span className="flex size-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <PackageSearch className="size-6" aria-hidden="true" />
            </span>
            <h2 className="mt-5 text-xl font-semibold text-foreground">AI 재고 최적화</h2>
            <p className="mt-2 flex-1 text-pretty text-sm leading-relaxed text-muted-foreground">
              SKU별 재고량·회전율을 분석해 Cross-ABC 슬로팅 등급을 산출하고, 이동 비용 기반 리슬롯팅
              후보를 추천합니다.
            </p>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary">
              최적화 대시보드 열기
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </span>
          </Link>

          {/* AI 자동창고 Simulation — 준비 중 */}
          <div
            className="relative flex flex-col rounded-2xl border border-dashed border-border bg-secondary/20 p-7"
            aria-disabled="true"
          >
            <span className="absolute right-5 top-5 inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground">
              <Clock className="size-3" aria-hidden="true" />
              준비 중
            </span>
            <span className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Cpu className="size-6" aria-hidden="true" />
            </span>
            <h2 className="mt-5 text-xl font-semibold text-muted-foreground">
              AI 자동창고 Simulation
            </h2>
            <p className="mt-2 flex-1 text-pretty text-sm leading-relaxed text-muted-foreground/80">
              통로·레인 구성과 SKU 배치를 가상으로 돌려 처리량과 병목을 예측하는 시뮬레이션입니다.
              곧 제공될 예정입니다.
            </p>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground/60">
              곧 공개
            </span>
          </div>
        </div>
      </main>
    </div>
  )
}
