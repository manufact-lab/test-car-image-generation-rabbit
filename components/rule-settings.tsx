"use client"

import { useReslotting } from "@/components/reslotting-context"
import { DEFAULT_THRESHOLDS, type SlottingThresholds } from "@/lib/reslotting"

const FIELDS: {
  key: keyof SlottingThresholds
  label: string
  hint: string
  min: number
  max: number
}[] = [
  { key: "volumeA", label: "물량 A 임계값", hint: "EA/day 이상이면 물량 A", min: 60, max: 250 },
  { key: "volumeB", label: "물량 B 임계값", hint: "EA/day 이상이면 물량 B", min: 20, max: 120 },
  { key: "freqA", label: "빈도 A 임계값", hint: "picks/day 이상이면 빈도 A", min: 20, max: 60 },
  { key: "freqB", label: "빈도 B 임계값", hint: "picks/day 이상이면 빈도 B", min: 5, max: 40 },
  {
    key: "minDepthGap",
    label: "최소 Depth 이동 폭",
    hint: "현재-권장 차이가 이 값 이상일 때만 리슬롯팅 (과잉 재배치 억제)",
    min: 1,
    max: 3,
  },
]

export function RuleSettings() {
  const { thresholds, setThresholds } = useReslotting()

  const update = (key: keyof SlottingThresholds, value: number) => {
    setThresholds({ ...thresholds, [key]: value })
  }

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
          {FIELDS.map((f) => (
            <div key={f.key}>
              <div className="mb-1 flex items-center justify-between">
                <label htmlFor={f.key} className="text-sm font-medium text-foreground">
                  {f.label}
                </label>
                <span className="font-mono text-sm tabular-nums text-primary">
                  {thresholds[f.key]}
                </span>
              </div>
              <input
                id={f.key}
                type="range"
                min={f.min}
                max={f.max}
                value={thresholds[f.key]}
                onChange={(e) => update(f.key, Number(e.target.value))}
                className="w-full accent-primary"
              />
              <p className="mt-0.5 text-xs text-muted-foreground">{f.hint}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}


