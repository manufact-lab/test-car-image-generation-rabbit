"use client"

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import { GAP_BY_GRADE, buildGapGradeSeries, type GapGrade } from "@/lib/analysis-data"
import { SectionShell, Hl } from "./section-shell"
import { AXIS_TICK, AXIS_LINE, GRID_STROKE, tooltipProps } from "./chart-theme"

function GradeGapChart({ g }: { g: GapGrade }) {
  const data = buildGapGradeSeries(g)
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-sm font-semibold text-foreground">{g.grade}등급</span>
        <span className="text-xs text-muted-foreground">
          2일 이후 <span className="font-mono font-semibold text-destructive">{g.after2Pct}%</span>
        </span>
      </div>
      <div className="h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 6, right: 4, bottom: 0, left: -18 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
            <XAxis dataKey="gap" tick={{ ...AXIS_TICK, fontSize: 9 }} axisLine={AXIS_LINE} tickLine={false} />
            <YAxis yAxisId="l" tick={{ ...AXIS_TICK, fontSize: 9 }} axisLine={false} tickLine={false} width={38} />
            <YAxis
              yAxisId="r"
              orientation="right"
              domain={[0, 100]}
              tick={{ ...AXIS_TICK, fontSize: 9 }}
              axisLine={false}
              tickLine={false}
              width={30}
              unit="%"
            />
            <Tooltip {...tooltipProps} />
            <Bar
              yAxisId="l"
              dataKey="cnt"
              name="출하건수"
              fill="var(--color-primary)"
              radius={[2, 2, 0, 0]}
              barSize={16}
            />
            <Line
              yAxisId="r"
              type="monotone"
              dataKey="cum"
              name="누적%"
              stroke="var(--color-chart-3)"
              strokeWidth={2}
              dot={{ r: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export function GapByGradeSection() {
  return (
    <SectionShell
      tag="2.6"
      title="등급별 생산-출하일자 GAP 분석"
      summary={
        <>
          등급별 생산-출하일자 Gap 분석 결과 전체 출하 건수의 70%를 차지하는 A등급에서도 생산 후 2일
          이후 출고되는 비중이 <Hl>14.6%</Hl>로 나타났습니다.
        </>
      }
      insight={
        <>
          FIFO 관리가 제대로 이행되고 있지 않음
          <br />
          C등급뿐 아니라 A등급에서도 생산-출하 일자 Gap 2일 이상 비중이 14.6%
          <br />→ 장기 체류 재고로 인한 Picking 생산성 저하 및 보관 공간 점유
        </>
      }
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {GAP_BY_GRADE.map((g) => (
          <GradeGapChart key={g.grade} g={g} />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <span className="size-2 rounded-[2px] bg-primary" /> 출하건수(막대)
        </span>
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <span className="size-2 rounded-[2px] bg-chart-3" /> 누적 비중 %(선)
        </span>
      </div>
    </SectionShell>
  )
}
