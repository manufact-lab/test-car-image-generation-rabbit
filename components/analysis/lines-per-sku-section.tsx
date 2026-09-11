import { LINES_PER_SKU, MULTI_LINE_PCT, A_MULTI_LINE_SKU } from "@/lib/analysis-data"
import { SectionShell, Hl } from "./section-shell"

export function LinesPerSkuSection() {
  return (
    <SectionShell
      tag="2.7"
      title="SKU별 출하 라인 수 분석"
      summary={
        <>
          SKU의 출하 라인 개수를 분석한 결과 전체 출하 건수의 <Hl>53.4%</Hl>가 다수의 출하 라인으로
          공급되어, 출하라인별 / SKU별 Picking Zone이 모두 필요할 수 있습니다.
        </>
      }
      insight={
        <>
          동일 SKU가 복수 출하 라인으로 공급되어 SKU별 관리와 라인별 관리가 혼재 (A등급 47개 중 23
          SKU가 출하 라인 48.7%)
          <br />→ SKU 단위 통합 보관 체계 + 다수 라인 공급 23개 SKU에 대한 별도 운영 기준 필요
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_260px]">
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[440px] text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50 text-xs text-muted-foreground">
                <th className="border-r border-border px-2 py-2 text-left font-medium">출하 라인 수</th>
                <th className="px-2 py-2 text-center font-medium">등급</th>
                <th className="px-2 py-2 text-right font-medium">SKU</th>
                <th className="px-2 py-2 text-right font-medium">출하건수</th>
                <th className="px-2 py-2 text-right font-medium">비중</th>
              </tr>
            </thead>
            <tbody>
              {LINES_PER_SKU.groups.map((group) => (
                <GroupBlock key={group.lines} group={group} />
              ))}
              <tr className="bg-secondary/60 font-semibold">
                <td className="border-r border-border px-2 py-2 text-foreground" colSpan={2}>
                  합계
                </td>
                <td className="px-2 py-2 text-right font-mono tabular-nums text-foreground">
                  {LINES_PER_SKU.total.sku}
                </td>
                <td className="px-2 py-2 text-right font-mono tabular-nums text-foreground">
                  {LINES_PER_SKU.total.cnt.toLocaleString()}
                </td>
                <td className="px-2 py-2 text-right font-mono tabular-nums text-foreground">100%</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3">
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
            <p className="text-xs font-medium text-muted-foreground">2개 이상 라인 공급</p>
            <p className="mt-1 font-mono text-3xl font-bold tabular-nums text-primary">
              {MULTI_LINE_PCT}%
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              출하 건수 기준 (3라인 16.8% + 2라인 36.6%)
            </p>
          </div>
          <div className="rounded-lg border border-border bg-secondary/40 p-4">
            <p className="text-xs font-medium text-muted-foreground">A등급 다수 출하 라인 공급</p>
            <p className="mt-1 font-mono text-3xl font-bold tabular-nums text-foreground">
              {A_MULTI_LINE_SKU} <span className="text-lg">SKU</span>
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">전체 출하 건수의 48.7%</p>
          </div>
        </div>
      </div>
    </SectionShell>
  )
}

function GroupBlock({ group }: { group: (typeof LINES_PER_SKU.groups)[number] }) {
  const highlight = group.lines >= 2
  return (
    <>
      {group.rows.map((r, i) => (
        <tr key={r.grade} className="border-b border-border/40">
          {i === 0 && (
            <td
              rowSpan={group.rows.length + 1}
              className={`border-r border-border px-2 py-1.5 text-center align-top font-mono text-lg font-semibold ${
                highlight ? "bg-primary/5 text-primary" : "text-foreground"
              }`}
            >
              {group.lines}
            </td>
          )}
          <td className="px-2 py-1.5 text-center text-foreground">{r.grade}</td>
          <td className="px-2 py-1.5 text-right font-mono tabular-nums text-foreground">{r.sku}</td>
          <td className="px-2 py-1.5 text-right font-mono tabular-nums text-foreground">
            {r.cnt.toLocaleString()}
          </td>
          <td className="px-2 py-1.5 text-right font-mono tabular-nums text-muted-foreground">
            {r.pct}%
          </td>
        </tr>
      ))}
      <tr className="border-b border-border bg-secondary/30 text-xs font-semibold">
        <td className="px-2 py-1.5 text-center text-muted-foreground">소계</td>
        <td className="px-2 py-1.5 text-right font-mono tabular-nums text-foreground">
          {group.subtotal.sku}
        </td>
        <td className="px-2 py-1.5 text-right font-mono tabular-nums text-foreground">
          {group.subtotal.cnt.toLocaleString()}
        </td>
        <td className="px-2 py-1.5 text-right font-mono tabular-nums text-primary">
          {group.subtotal.pct}%
        </td>
      </tr>
    </>
  )
}
