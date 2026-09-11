"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import { ABC_ROWS, ABC_TOTAL, buildParetoCurve, ABC_BOUNDARIES } from "@/lib/analysis-data"
import { SectionShell, Hl } from "./section-shell"
import { AXIS_TICK, AXIS_LINE, GRID_STROKE, tooltipProps } from "./chart-theme"

const curve = buildParetoCurve()

export function AbcSection() {
  return (
    <SectionShell
      tag="2.3"
      title="SKU별 ABC 분석"
      summary={
        <>
          ABC 분석 결과 A등급 <Hl>47 SKU</Hl> / 전체 출하 건수의 <Hl>69.7%</Hl>, B등급{" "}
          <Hl>99 SKU</Hl> / 20.3%, C등급 <Hl>631 SKU</Hl> / 10% 수준으로 분석되었습니다.
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        {/* 파레토 곡선 */}
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={curve} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
              <XAxis
                dataKey="rank"
                tick={{ ...AXIS_TICK, fontSize: 10 }}
                axisLine={AXIS_LINE}
                tickLine={false}
                interval={9}
              />
              <YAxis
                domain={[0, 100]}
                tick={AXIS_TICK}
                axisLine={false}
                tickLine={false}
                width={40}
                unit="%"
              />
              <Tooltip {...tooltipProps} formatter={(v: number) => [`${v}%`, "누적 출하 비중"]} />
              <ReferenceLine
                x={ABC_BOUNDARIES.a}
                stroke="var(--color-primary)"
                strokeDasharray="4 4"
                label={{ value: "A|B", position: "top", fill: "var(--color-primary)", fontSize: 10 }}
              />
              <ReferenceLine
                x={ABC_BOUNDARIES.b}
                stroke="var(--color-chart-3)"
                strokeDasharray="4 4"
                label={{ value: "B|C", position: "top", fill: "var(--color-chart-3)", fontSize: 10 }}
              />
              <Line
                type="monotone"
                dataKey="cum"
                stroke="var(--color-primary)"
                strokeWidth={2.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
          <p className="mt-1 text-center text-xs text-muted-foreground">
            SKU 순위(출하건수 내림차순) → 누적 출하 비중(%)
          </p>
        </div>

        {/* 등급 요약 테이블 */}
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50 text-xs text-muted-foreground">
                <th className="px-3 py-2 text-left font-medium">등급</th>
                <th className="px-3 py-2 text-right font-medium">SKU</th>
                <th className="px-3 py-2 text-right font-medium">출하건수</th>
              </tr>
            </thead>
            <tbody>
              {ABC_ROWS.map((r) => (
                <tr key={r.grade} className="border-b border-border/60">
                  <td className="px-3 py-2 font-medium text-foreground">{r.grade}</td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums text-foreground">
                    {r.sku} <span className="text-xs text-muted-foreground">({r.skuPct}%)</span>
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums text-foreground">
                    {r.cnt.toLocaleString()}{" "}
                    <span className="text-xs text-primary">({r.cntPct}%)</span>
                  </td>
                </tr>
              ))}
              <tr className="bg-secondary/60 font-semibold">
                <td className="px-3 py-2 text-foreground">합계</td>
                <td className="px-3 py-2 text-right font-mono tabular-nums text-foreground">
                  {ABC_TOTAL.sku}
                </td>
                <td className="px-3 py-2 text-right font-mono tabular-nums text-foreground">
                  {ABC_TOTAL.cnt.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
          <p className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
            A등급 6%의 SKU가 출하의 약 70%를 차지 → 골든존 우선 배치 대상
          </p>
        </div>
      </div>
    </SectionShell>
  )
}
