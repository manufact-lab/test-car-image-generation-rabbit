"use client"

import { useReslotting, type HistoryEntry } from "@/components/reslotting-context"
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
]

export function RuleSettings() {
  const { thresholds, setThresholds, history } = useReslotting()

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

      <ChangeHistory history={history} />
    </div>
  )
}

const KIND_STYLE: Record<HistoryEntry["kind"], string> = {
  order: "bg-chart-3/15 text-warning",
  approve: "bg-primary/15 text-primary",
  hold: "bg-warning/15 text-warning",
  apply: "bg-success/15 text-success",
  rule: "bg-muted text-muted-foreground",
}

const KIND_LABEL: Record<HistoryEntry["kind"], string> = {
  order: "주문",
  approve: "승인",
  hold: "보류",
  apply: "실행",
  rule: "룰",
}

function ChangeHistory({ history }: { history: HistoryEntry[] }) {
  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold text-foreground">변경 이력</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">주문 유입 · 승인 · 이동 · 룰 조정 로그</p>
      </div>

      {history.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-muted-foreground">
          아직 기록된 변경이 없습니다.
        </div>
      ) : (
        <ul className="max-h-80 divide-y divide-border overflow-y-auto">
          {history.map((h) => (
            <li key={h.id} className="flex items-start gap-3 px-5 py-2.5">
              <span
                className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${KIND_STYLE[h.kind]}`}
              >
                {KIND_LABEL[h.kind]}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground">{h.message}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {h.skuId !== "—" ? `${h.skuId} · ` : ""}
                  {new Date(h.ts).toLocaleTimeString("ko-KR")}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
