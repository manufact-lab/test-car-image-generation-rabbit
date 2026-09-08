"use client"

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import type { SkuRow } from "@/lib/inventory-data"
import { depthEfficiencyCurve, abcClass } from "@/lib/inventory-data"

export function DepthEfficiencyChart({ row }: { row: SkuRow }) {
  const data = depthEfficiencyCurve(row)
  const current = row.location.depth
  const cls = abcClass(row)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <span className="size-2 rounded-[3px] bg-primary" /> 피킹 효율 (Pick %)
        </span>
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <span className="size-2 rounded-[3px] bg-muted-foreground" /> 적재 밀도 (Density %)
        </span>
        <span className="ml-auto rounded-md border border-border bg-secondary/50 px-2 py-0.5 font-mono text-muted-foreground">
          Class {cls}
        </span>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 8, right: 8, bottom: 0, left: -18 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border)"
              vertical={false}
            />
            <XAxis
              dataKey="depth"
              tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
              axisLine={{ stroke: "var(--color-border)" }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: "var(--color-secondary)", opacity: 0.4 }}
              contentStyle={{
                background: "var(--color-popover)",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                fontSize: 12,
                color: "var(--color-popover-foreground)",
              }}
              labelStyle={{ color: "var(--color-foreground)" }}
            />
            <Bar
              dataKey="storageDensity"
              name="Storage Density"
              fill="var(--color-muted-foreground)"
              radius={[3, 3, 0, 0]}
              barSize={26}
              opacity={0.35}
            />
            <Line
              type="monotone"
              dataKey="pickEfficiency"
              name="Pick Efficiency"
              stroke="var(--color-primary)"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "var(--color-primary)" }}
              activeDot={{ r: 5 }}
            />
            <ReferenceLine
              x={data[current - 1]?.depth}
              stroke="var(--color-destructive)"
              strokeDasharray="4 4"
              label={{
                value: "현재",
                position: "top",
                fill: "var(--color-destructive)",
                fontSize: 10,
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
