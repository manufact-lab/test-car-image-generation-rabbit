"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from "recharts"
import { GAP_ROWS } from "@/lib/analysis-data"
import { SectionShell, Hl } from "./section-shell"
import { AXIS_TICK, AXIS_LINE, GRID_STROKE, tooltipProps } from "./chart-theme"

export function GapSection() {
  return (
    <SectionShell
      tag="2.5"
      title="생산-출하일자 GAP 분석"
      summary={
        <>
          생산일자와 출하일자 Gap 분석 결과 생산 후 <Hl>1일 이내</Hl> 출고 비중이 <Hl>83.3%</Hl>였으며,
          생산 후 2일 이후 출고되는 비중이 <Hl>16.7%</Hl>입니다.
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={GAP_ROWS} margin={{ top: 20, right: 8, bottom: 0, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
              <XAxis
                dataKey="gap"
                tick={AXIS_TICK}
                axisLine={AXIS_LINE}
                tickLine={false}
              />
              <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={52} />
              <Tooltip {...tooltipProps} formatter={(v: number) => [v.toLocaleString(), "출하건수"]} />
              <Bar dataKey="cnt" radius={[3, 3, 0, 0]} barSize={40}>
                {GAP_ROWS.map((r, i) => (
                  <Cell
                    key={r.gap}
                    fill={i <= 1 ? "var(--color-primary)" : "var(--color-chart-3)"}
                  />
                ))}
                <LabelList
                  dataKey="cnt"
                  position="top"
                  formatter={(v: number) => v.toLocaleString()}
                  style={{ fill: "var(--color-foreground)", fontSize: 10 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="mt-1 text-center text-xs text-muted-foreground">
            생산 후 경과일(Gap) 별 출하 건수 · 단위: 건수
          </p>
        </div>

        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50 text-xs text-muted-foreground">
                <th className="px-2 py-2 text-left font-medium">구분</th>
                <th className="px-2 py-2 text-right font-medium">SKU</th>
                <th className="px-2 py-2 text-right font-medium">출하건수</th>
                <th className="px-2 py-2 text-right font-medium">출하비중</th>
              </tr>
            </thead>
            <tbody>
              {GAP_ROWS.map((r, i) => (
                <tr key={r.gap} className={`border-b border-border/60 ${i <= 1 ? "bg-primary/5" : ""}`}>
                  <td className="px-2 py-1.5 font-medium text-foreground">{r.gap}</td>
                  <td className="px-2 py-1.5 text-right font-mono tabular-nums text-foreground">
                    {r.sku}
                  </td>
                  <td className="px-2 py-1.5 text-right font-mono tabular-nums text-foreground">
                    {r.cnt.toLocaleString()}
                  </td>
                  <td className="px-2 py-1.5 text-right font-mono tabular-nums text-muted-foreground">
                    {r.pct}%
                  </td>
                </tr>
              ))}
              <tr className="bg-secondary/60 font-semibold">
                <td className="px-2 py-2 text-foreground">총합계</td>
                <td className="px-2 py-2 text-right font-mono tabular-nums text-foreground">777</td>
                <td className="px-2 py-2 text-right font-mono tabular-nums text-foreground">
                  180,985
                </td>
                <td className="px-2 py-2 text-right font-mono tabular-nums text-foreground">100%</td>
              </tr>
            </tbody>
          </table>
          <p className="border-t border-border px-2 py-2 text-xs text-muted-foreground">
            ※ Gap 0~1일(파란색) 합계 = 83.3%
          </p>
        </div>
      </div>
    </SectionShell>
  )
}
