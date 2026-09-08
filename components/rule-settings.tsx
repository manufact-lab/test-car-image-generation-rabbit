"use client"

import { useReslotting } from "@/components/reslotting-context"
import {
  DEFAULT_THRESHOLDS,
  DEFAULT_MOVE_PARAMS,
  type SlottingThresholds,
  type MoveCostParams,
} from "@/lib/reslotting"

type Field<T> = {
  key: keyof T
  label: string
  hint: string
  min: number
  max: number
  step?: number
  unit?: string
}

const GRADE_FIELDS: Field<SlottingThresholds>[] = [
  { key: "volumeA", label: "물량 A 임계값", hint: "EA/day 이상이면 물량 A", min: 60, max: 250, unit: "EA" },
  { key: "volumeB", label: "물량 B 임계값", hint: "EA/day 이상이면 물량 B", min: 20, max: 120, unit: "EA" },
  { key: "freqA", label: "빈도 A 임계값", hint: "picks/day 이상이면 빈도 A", min: 20, max: 60, unit: "picks" },
  { key: "freqB", label: "빈도 B 임계값", hint: "picks/day 이상이면 빈도 B", min: 5, max: 40, unit: "picks" },
  {
    key: "minDepthGap",
    label: "최소 Depth 이동 폭",
    hint: "현재-권장 차이가 이 값 이상일 때만 리슬롯팅 (과잉 재배치 억제)",
    min: 1,
    max: 3,
    unit: "칸",
  },
]

const COST_FIELDS: Field<MoveCostParams>[] = [
  { key: "palletCapacity", label: "팔레트당 적재량", hint: "재고를 팔레트 수로 환산 (EA/pallet)", min: 12, max: 120, step: 4, unit: "EA" },
  { key: "shuttleHandleSec", label: "셔틀 취급시간", hint: "팔레트 1개 집고 놓는 데 드는 시간", min: 10, max: 90, step: 5, unit: "초" },
  { key: "travelSecPerDepth", label: "깊이 1칸 주행시간", hint: "셔틀이 레인 깊이 한 칸 주행하는 시간", min: 4, max: 30, step: 1, unit: "초" },
  { key: "liftSec", label: "리프트 시간", hint: "레벨(상하) 한 칸 이동 시 리프트 시간", min: 5, max: 60, step: 5, unit: "초" },
  { key: "laneBlockLossFactor", label: "레인 차단 손실 계수", hint: "이동 중 레인 피킹 정지 손실 가중치", min: 0, max: 1.5, step: 0.05 },
  { key: "gradeValidityDays", label: "등급 유효기간", hint: "이득을 회수할 수 있는 기간 (순이득 계산 기준)", min: 3, max: 30, step: 1, unit: "일" },
  { key: "paybackThresholdDays", label: "Payback 임계", hint: "회수 일수가 이 값 이하면 '추천', 초과면 '검토필요'", min: 1, max: 30, step: 1, unit: "일" },
]

function SliderRow<T extends Record<string, number>>({
  field,
  value,
  onChange,
}: {
  field: Field<T>
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label htmlFor={String(field.key)} className="text-sm font-medium text-foreground">
          {field.label}
        </label>
        <span className="font-mono text-sm tabular-nums text-primary">
          {value}
          {field.unit ? <span className="ml-0.5 text-xs text-muted-foreground">{field.unit}</span> : null}
        </span>
      </div>
      <input
        id={String(field.key)}
        type="range"
        min={field.min}
        max={field.max}
        step={field.step ?? 1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
      />
      <p className="mt-0.5 text-xs text-muted-foreground">{field.hint}</p>
    </div>
  )
}

export function RuleSettings() {
  const { thresholds, setThresholds, moveParams, setMoveParams } = useReslotting()

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">슬롯 룰 설정</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Cross-ABC 등급 임계값 · 변경 시 큐가 즉시 재계산됩니다
            </p>
          </div>
          <button
            onClick={() => setThresholds(DEFAULT_THRESHOLDS)}
            className="rounded-md border border-border bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground transition-colors hover:bg-accent"
          >
            기본값
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          {GRADE_FIELDS.map((f) => (
            <SliderRow
              key={String(f.key)}
              field={f}
              value={thresholds[f.key]}
              onChange={(v) => setThresholds({ ...thresholds, [f.key]: v })}
            />
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">이동 비용 파라미터</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              순이득·Payback 계산의 입력값 · 변경 시 큐와 3안 비교가 즉시 재계산됩니다
            </p>
          </div>
          <button
            onClick={() => setMoveParams(DEFAULT_MOVE_PARAMS)}
            className="rounded-md border border-border bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground transition-colors hover:bg-accent"
          >
            기본값
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          {COST_FIELDS.map((f) => (
            <SliderRow
              key={String(f.key)}
              field={f}
              value={moveParams[f.key]}
              onChange={(v) => setMoveParams({ ...moveParams, [f.key]: v })}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
