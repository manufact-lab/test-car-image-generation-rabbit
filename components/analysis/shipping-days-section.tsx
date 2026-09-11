import {
  SHIP_DAYS_BUCKETS,
  SHIP_DAYS_ROWS,
  SHIP_DAYS_TOTALS,
  type DayCell,
} from "@/lib/analysis-data"
import { SectionShell, Hl } from "./section-shell"

// 버킷 하나당 3개 실제 컬럼(SKU / 출하건수 / 출하비중)을 그린다.
function TripleCells({ cell, highlight, last }: { cell: DayCell; highlight: boolean; last: boolean }) {
  const border = last ? "border-r border-border" : ""
  const bg = highlight ? "bg-primary/5" : ""
  if (!cell) {
    return (
      <>
        <td className={`px-2 py-1.5 text-right font-mono text-muted-foreground/40 ${bg}`}>-</td>
        <td className={`px-2 py-1.5 text-right font-mono text-muted-foreground/40 ${bg}`}>-</td>
        <td className={`px-2 py-1.5 text-right font-mono text-muted-foreground/40 ${bg} ${border}`}>-</td>
      </>
    )
  }
  return (
    <>
      <td className={`px-2 py-1.5 text-right font-mono tabular-nums text-foreground ${bg}`}>
        {cell.sku}
      </td>
      <td className={`px-2 py-1.5 text-right font-mono tabular-nums text-foreground ${bg}`}>
        {cell.cnt.toLocaleString()}
      </td>
      <td
        className={`px-2 py-1.5 text-right font-mono tabular-nums ${bg} ${border} ${
          highlight ? "font-semibold text-primary" : "text-muted-foreground"
        }`}
      >
        {cell.pct}%
      </td>
    </>
  )
}

export function ShippingDaysSection() {
  return (
    <SectionShell
      tag="2.4"
      title="등급별 출하일수 분석"
      summary={
        <>
          등급별 출하일수 분석 결과 Daily(1~2일)로 출고되는 물량이 <Hl>153 SKU</Hl>, 전체 물량의{" "}
          <Hl>87.7%</Hl>로 나타났습니다.
        </>
      }
      insight={
        <>
          Daily 출고 구간에 A·B·C 등급 SKU가 모두 포함되어 있음
          <br />→ 출하빈도 기준의 보관 위치, 재고일수 관리 필요
        </>
      }
    >
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[620px] text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50 text-xs text-muted-foreground">
              <th rowSpan={2} className="border-r border-border px-2 py-2 font-medium">
                구분
              </th>
              {SHIP_DAYS_BUCKETS.map((b, i) => (
                <th
                  key={b}
                  colSpan={3}
                  className={`px-2 py-1.5 text-center font-medium ${
                    i === 0 ? "bg-primary/10 text-primary" : ""
                  } ${i < SHIP_DAYS_BUCKETS.length - 1 ? "border-r border-border" : ""}`}
                >
                  {b}
                </th>
              ))}
            </tr>
            <tr className="border-b border-border bg-secondary/30 text-[11px] text-muted-foreground">
              {SHIP_DAYS_BUCKETS.map((b, i) => {
                const first = i === 0
                const last = i < SHIP_DAYS_BUCKETS.length - 1
                return (
                  <SubHead key={b} first={first} last={last} />
                )
              })}
            </tr>
          </thead>
          <tbody>
            {SHIP_DAYS_ROWS.map((row) => (
              <tr key={row.grade} className="border-b border-border/60">
                <td className="border-r border-border px-2 py-1.5 text-center font-semibold text-foreground">
                  {row.grade}
                </td>
                {row.cells.map((c, i) => (
                  <TripleCells
                    key={i}
                    cell={c}
                    highlight={i === 0}
                    last={i < row.cells.length - 1}
                  />
                ))}
              </tr>
            ))}
            <tr className="bg-secondary/60 font-semibold">
              <td className="border-r border-border px-2 py-2 text-center text-foreground">합계</td>
              {SHIP_DAYS_TOTALS.map((c, i) => (
                <TripleCells key={i} cell={c} highlight={i === 0} last={i < SHIP_DAYS_TOTALS.length - 1} />
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        ※ 캐리어수 5개 최근 기준 · 출하일수 4일 기준 (출하건수가 평균보다 50% 이상 적은 4일 제외)
      </p>
    </SectionShell>
  )
}

function SubHead({ first, last }: { first: boolean; last: boolean }) {
  const bg = first ? "bg-primary/10" : ""
  return (
    <>
      <th className={`px-2 py-1 text-right font-medium ${bg}`}>SKU</th>
      <th className={`px-2 py-1 text-right font-medium ${bg}`}>출하건수</th>
      <th className={`px-2 py-1 text-right font-medium ${bg} ${last ? "border-r border-border" : ""}`}>
        출하비중
      </th>
    </>
  )
}
