"use client"

import { Warehouse } from "lucide-react"
import {
  STORAGE_SIZING,
  STORAGE_BUILDUP,
  STORAGE_INCREASE_PCT,
} from "@/lib/analysis-data"
import { SectionShell, Hl } from "./section-shell"

const SEGMENT_STYLE: Record<string, string> = {
  base: "bg-primary",
  buffer: "bg-chart-2",
  shuffle: "bg-chart-3",
}

const DOT_STYLE: Record<string, string> = {
  base: "bg-primary",
  buffer: "bg-chart-2",
  shuffle: "bg-chart-3",
}

export function StorageSizingSection() {
  const total = STORAGE_SIZING.requiredPlt

  return (
    <SectionShell
      tag="2.8"
      title="필요 보관량 산정"
      summary={
        <>
          분석된 물량 기준 기준 보관 소요는 <Hl>{STORAGE_SIZING.basePlt.toLocaleString()} PLT</Hl>
          이나, 4-way shuttle 특성상 물량 재배치 및 수요 변동 여유율을 포함하여 약{" "}
          <Hl>{STORAGE_INCREASE_PCT}%</Hl> 증가한{" "}
          <Hl>{STORAGE_SIZING.requiredPlt.toLocaleString()} PLT 이상</Hl>의 보관량이 필요할 것으로
          예상됩니다.
        </>
      }
      insight={
        <>
          딥레인 셔틀랙은 한 레인에 단일 SKU만 채우는 구조라 부분 적재 시 빈 공간(허니콤)이 발생하고,
          리슬롯팅 이동을 위한 여유 로케이션도 상시 필요합니다.
          <br />→ 순수 물량 대비{" "}
          <span className="font-semibold text-primary">
            {(total - STORAGE_SIZING.basePlt).toLocaleString()} PLT
          </span>{" "}
          의 추가 보관 능력을 설계 단계에서 확보해야 합니다.
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
        {/* 좌: 누적 구성 */}
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs font-medium text-muted-foreground">보관량 산정 구성 (단위: PLT)</p>

          {/* 누적 막대 */}
          <div className="mt-3 flex h-10 w-full overflow-hidden rounded-md">
            {STORAGE_BUILDUP.map((s) => (
              <div
                key={s.key}
                className={`flex items-center justify-center ${SEGMENT_STYLE[s.kind]}`}
                style={{ width: `${(s.value / total) * 100}%` }}
                title={`${s.label}: ${s.value.toLocaleString()} PLT`}
              >
                {s.value / total > 0.08 && (
                  <span className="px-1 text-[11px] font-semibold text-primary-foreground">
                    {s.value.toLocaleString()}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* 단계 설명 */}
          <ul className="mt-4 space-y-2.5">
            {STORAGE_BUILDUP.map((s) => (
              <li key={s.key} className="flex items-start gap-2.5">
                <span
                  className={`mt-1 size-2.5 shrink-0 rounded-sm ${DOT_STYLE[s.kind]}`}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-medium text-foreground">{s.label}</span>
                    <span className="font-mono text-sm tabular-nums text-foreground">
                      {s.kind === "base" ? "" : "+"}
                      {s.value.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">{s.desc}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-3 flex items-baseline justify-between border-t border-border pt-3">
            <span className="text-sm font-semibold text-foreground">최종 필요 보관량</span>
            <span className="font-mono text-base font-bold tabular-nums text-primary">
              {total.toLocaleString()} PLT
            </span>
          </div>
        </div>

        {/* 우: 결론 콜아웃 */}
        <div className="flex flex-col justify-center rounded-lg border border-primary/30 bg-primary/5 p-5 text-center">
          <span className="mx-auto flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Warehouse className="size-5" aria-hidden="true" />
          </span>
          <p className="mt-3 text-xs font-medium text-muted-foreground">필요 보관량</p>
          <p className="mt-1 font-mono text-4xl font-bold tracking-tight text-primary">
            {total.toLocaleString()}
          </p>
          <p className="text-sm font-semibold text-foreground">PLT 이상</p>
          <p className="mt-3 rounded-md border border-border bg-card px-2 py-1.5 text-xs text-muted-foreground">
            기준 {STORAGE_SIZING.basePlt.toLocaleString()} PLT 대비{" "}
            <span className="font-semibold text-primary">+{STORAGE_INCREASE_PCT}%</span>
          </p>
        </div>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        ※ 여유율(+{STORAGE_SIZING.bufferPct}%)은 수요 변동 대응 안전 재고, 재배치(+
        {STORAGE_SIZING.shufflePct}%)는 4-way shuttle 딥레인 허니콤 손실 및 리슬롯팅 이동 공간 기준
      </p>
    </SectionShell>
  )
}
