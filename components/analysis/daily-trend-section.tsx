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
import {
  buildDailySeries,
  DAILY_AVG_SHIPMENTS,
  DAILY_AVG_SKUS,
} from "@/lib/analysis-data"
import { SectionShell, Hl } from "./section-shell"
import { AXIS_TICK, AXIS_LINE, GRID_STROKE, tooltipProps } from "./chart-theme"

const data = buildDailySeries()

function TrendChart({
  dataKey,
  color,
  avg,
  unit,
}: {
  dataKey: "shipments" | "skus"
  color: string
  avg: number
  unit: string
}) {
  const values = data.map((d) => d[dataKey])
  const peak = Math.max(...values)
  const trough = Math.min(...values)
  return (
    <div>
      <div className="mb-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        <span className="text-muted-foreground">
          일 평균 <span className="font-mono font-semibold text-foreground">{avg.toLocaleString()}</span>
          {unit}
        </span>
        <span className="text-muted-foreground">
          최대 <span className="font-mono font-semibold text-primary">{peak.toLocaleString()}</span>
        </span>
        <span className="text-muted-foreground">
          최소 <span className="font-mono font-semibold text-destructive">{trough.toLocaleString()}</span>
        </span>
      </div>
      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 10, bottom: 0, left: -12 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ ...AXIS_TICK, fontSize: 9 }}
              axisLine={AXIS_LINE}
              tickLine={false}
              interval={6}
            />
            <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={44} />
            <Tooltip {...tooltipProps} />
            <ReferenceLine
              y={avg}
              stroke="var(--color-muted-foreground)"
              strokeDasharray="5 4"
              label={{
                value: `평균 ${avg.toLocaleString()}`,
                position: "insideTopRight",
                fill: "var(--color-muted-foreground)",
                fontSize: 10,
              }}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              name={unit}
              stroke={color}
              strokeWidth={2}
              dot={{ r: 1.5, fill: color }}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export function DailyTrendSection() {
  return (
    <SectionShell
      tag="2.2"
      title="일자별 SKU / 출하 건수 분석"
      summary={
        <>
          2026년 3월~4월 2개월 데이터를 분석한 결과, 일 평균 <Hl>3,733건</Hl> / 일 평균{" "}
          <Hl>216 SKU</Hl>가 출고되었습니다 (출하 건수가 절반으로 떨어진 4일 제외).
        </>
      }
    >
      <div className="grid grid-cols-1 gap-5">
        <div>
          <p className="mb-1 text-xs font-semibold text-foreground">출하 건수 분석 · 단위: 건수</p>
          <TrendChart dataKey="shipments" color="var(--color-destructive)" avg={DAILY_AVG_SHIPMENTS} unit="건" />
        </div>
        <div>
          <p className="mb-1 text-xs font-semibold text-foreground">출하 SKU 분석 · 단위: 건수</p>
          <TrendChart dataKey="skus" color="var(--color-primary)" avg={DAILY_AVG_SKUS} unit="SKU" />
        </div>
      </div>
    </SectionShell>
  )
}
