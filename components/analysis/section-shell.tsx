import type { ReactNode } from "react"
import { Lightbulb } from "lucide-react"

export function SectionShell({
  tag,
  title,
  summary,
  insight,
  children,
}: {
  tag: string
  title: string
  summary: ReactNode
  insight?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="scroll-mt-20 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <span className="rounded-md bg-primary/15 px-2 py-0.5 font-mono text-xs font-semibold text-primary">
          {tag}
        </span>
        <h3 className="text-pretty text-base font-semibold text-foreground sm:text-lg">{title}</h3>
      </div>

      <p className="mt-3 rounded-lg border-l-[3px] border-primary bg-secondary/50 px-3.5 py-2.5 text-sm leading-relaxed text-foreground">
        {summary}
      </p>

      {insight && (
        <div className="mt-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-primary">
            <Lightbulb className="size-3.5" aria-hidden="true" />
            시사점
          </p>
          <div className="mt-1.5 text-sm leading-relaxed text-foreground">{insight}</div>
        </div>
      )}

      <div className="mt-4">{children}</div>
    </section>
  )
}

// 수치 강조용 인라인 하이라이트
export function Hl({ children }: { children: ReactNode }) {
  return <span className="font-semibold text-primary">{children}</span>
}
