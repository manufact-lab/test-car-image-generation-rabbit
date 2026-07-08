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
import {
  depthEfficiencyCurve,
  optimalDepth,
  abcClass,
} from "@/lib/inventory-data"

export function DepthEfficiencyChart({ row }: { row: SkuRow }) {
  const data = depthEfficiencyCurve(row)
  const best = optimalDepth(row)
  const current = row.location.depth
  const cls = abcClass(row)
  const willMove = best !== current

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <span className="size-2 rounded-[3px] bg-primary" /> Pick Efficiency (%)
        </span>
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <span className="size-2 rounded-[3px] bg-muted-foreground" /> Storage
          Density (%)
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
                value: "Current",
                position: "top",
                fill: "var(--color-destructive)",
                fontSize: 10,
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div
        className={
          willMove
            ? "rounded-lg border border-primary/40 bg-primary/10 p-3"
            : "rounded-lg border border-border bg-secondary/40 p-3"
        }
      >
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          AI Recommendation
        </div>
        {willMove ? (
          <p className="mt-1 text-sm text-foreground">
            Relocate from{" "}
            <span className="font-mono font-semibold text-destructive">
              D{current}-Deep
            </span>{" "}
            to{" "}
            <span className="font-mono font-semibold text-primary">
              D{best}-Deep
            </span>{" "}
            to balance retrieval speed against lane density for this Class {cls}{" "}
            mover.
          </p>
        ) : (
          <p className="mt-1 text-sm text-foreground">
            Current{" "}
            <span className="font-mono font-semibold text-primary">
              D{current}-Deep
            </span>{" "}
            placement is already optimal for this Class {cls} mover.
          </p>
        )}
      </div>
    </div>
  )
}
