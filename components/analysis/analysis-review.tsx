"use client"

import { useState, type ReactNode } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  CheckCircle2,
  RotateCcw,
  Lightbulb,
} from "lucide-react"
import { STORAGE_SIZING, STORAGE_INCREASE_PCT } from "@/lib/analysis-data"
import { CleansingSection } from "./cleansing-section"
import { DailyTrendSection } from "./daily-trend-section"
import { AbcSection } from "./abc-section"
import { ShippingDaysSection } from "./shipping-days-section"
import { GapSection } from "./gap-section"
import { GapByGradeSection } from "./gap-by-grade-section"
import { LinesPerSkuSection } from "./lines-per-sku-section"
import { StorageSizingSection } from "./storage-sizing-section"

type Kpi = { label: string; value: string; unit?: string; emphasis?: boolean }

type ReviewStep = {
  title: string
  kpis: Kpi[]
  conclusion: string
  action?: string
  detail: ReactNode
}

const STEPS: ReviewStep[] = [
  {
    title: "데이터 클렌징",
    kpis: [
      { label: "원본 데이터", value: "182,246", unit: "건" },
      { label: "제외 (생산일자 누락)", value: "1,261", unit: "건" },
      { label: "분석 대상", value: "180,985", unit: "건", emphasis: true },
    ],
    conclusion: "원본의 99.3%를 분석에 사용합니다. 데이터 품질은 양호합니다.",
    detail: <CleansingSection />,
  },
  {
    title: "일별 출하량",
    kpis: [
      { label: "일 평균 출하", value: "3,733", unit: "건", emphasis: true },
      { label: "일 평균 SKU", value: "216", unit: "SKU" },
      { label: "분석 기간", value: "2", unit: "개월" },
    ],
    conclusion: "하루 약 3,700건, 216개 품목이 꾸준히 나갑니다.",
    detail: <DailyTrendSection />,
  },
  {
    title: "ABC 등급",
    kpis: [
      { label: "A등급 SKU", value: "47", unit: "SKU", emphasis: true },
      { label: "A등급 출하 비중", value: "69.7", unit: "%", emphasis: true },
      { label: "C등급 SKU", value: "631", unit: "SKU" },
    ],
    conclusion: "상위 6%의 품목(47개)이 출하의 70%를 차지합니다.",
    action: "A등급 47개를 출고구 가까운 골든존에 우선 배치합니다.",
    detail: <AbcSection />,
  },
  {
    title: "출하 빈도",
    kpis: [
      { label: "매일 출고 SKU", value: "153", unit: "SKU" },
      { label: "매일 출고 물량 비중", value: "87.7", unit: "%", emphasis: true },
    ],
    conclusion: "물량의 88%가 매일(1~2일 간격) 출고됩니다.",
    action: "등급과 별개로 출하 빈도 기준의 보관 위치가 필요합니다.",
    detail: <ShippingDaysSection />,
  },
  {
    title: "생산-출하 GAP",
    kpis: [
      { label: "1일 이내 출고", value: "83.3", unit: "%", emphasis: true },
      { label: "2일 이상 체류", value: "16.7", unit: "%" },
    ],
    conclusion: "대부분 생산 다음 날 나가지만, 6건 중 1건은 2일 이상 머뭅니다.",
    detail: <GapSection />,
  },
  {
    title: "등급별 GAP",
    kpis: [
      { label: "A등급 2일 이상 체류", value: "14.6", unit: "%", emphasis: true },
    ],
    conclusion: "많이 나가는 A등급조차 15%가 오래 머뭅니다. 선입선출(FIFO)이 지켜지지 않고 있습니다.",
    action: "장기 체류 재고가 공간을 점유하고 피킹 효율을 떨어뜨립니다.",
    detail: <GapByGradeSection />,
  },
  {
    title: "출하 라인",
    kpis: [
      { label: "복수 라인 공급 비중", value: "53.4", unit: "%", emphasis: true },
      { label: "복수 라인 A등급", value: "23", unit: "SKU" },
    ],
    conclusion: "출하의 절반 이상이 여러 라인으로 공급됩니다.",
    action: "SKU 단위로 통합 보관하고, 23개 품목은 별도 운영 기준을 둡니다.",
    detail: <LinesPerSkuSection />,
  },
  {
    title: "필요 보관량",
    kpis: [
      { label: "순수 물량", value: STORAGE_SIZING.basePlt.toLocaleString(), unit: "PLT" },
      { label: "여유율", value: `+${STORAGE_INCREASE_PCT}`, unit: "%" },
      {
        label: "필요 보관량",
        value: STORAGE_SIZING.requiredPlt.toLocaleString(),
        unit: "PLT 이상",
        emphasis: true,
      },
    ],
    conclusion: `셔틀랙 재배치 여유를 포함해 최소 ${STORAGE_SIZING.requiredPlt.toLocaleString()} PLT를 확보해야 합니다.`,
    action: "이 수치를 기준으로 배치 설계를 진행합니다.",
    detail: <StorageSizingSection />,
  },
]

export function AnalysisReview({
  fileName,
  onReset,
}: {
  fileName: string | null
  onReset: () => void
}) {
  const [current, setCurrent] = useState(0)
  const [approved, setApproved] = useState(0)
  const [showDetail, setShowDetail] = useState(false)

  const allDone = approved >= STEPS.length
  const step = STEPS[current]

  const goTo = (i: number) => {
    setCurrent(i)
    setShowDetail(false)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const approve = () => {
    const next = Math.max(approved, current + 1)
    setApproved(next)
    if (current < STEPS.length - 1) goTo(current + 1)
    else setCurrent(STEPS.length)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          <span className="font-mono">{fileName}</span> · 항목별로 확인 후 승인해주세요
        </p>
        <button
          onClick={onReset}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
        >
          <RotateCcw className="size-3.5" aria-hidden="true" />
          다시 업로드
        </button>
      </div>

      <nav aria-label="분석 항목 진행 상황">
        <ol className="flex gap-1.5">
          {STEPS.map((s, i) => {
            const isDone = i < approved
            const isCurrent = i === current
            const reachable = i <= approved
            return (
              <li key={s.title} className="flex-1">
                <button
                  onClick={() => reachable && goTo(i)}
                  disabled={!reachable}
                  aria-current={isCurrent ? "step" : undefined}
                  className="group flex w-full flex-col gap-1.5 text-left disabled:cursor-not-allowed"
                >
                  <span
                    className={`h-1.5 w-full rounded-full transition-colors ${
                      isCurrent ? "bg-primary" : isDone ? "bg-primary/40" : "bg-secondary"
                    }`}
                  />
                  <span
                    className={`hidden items-center gap-1 text-[11px] md:flex ${
                      isCurrent
                        ? "font-semibold text-foreground"
                        : isDone
                          ? "text-muted-foreground group-hover:text-foreground"
                          : "text-muted-foreground/50"
                    }`}
                  >
                    {isDone && <Check className="size-3 text-primary" aria-hidden="true" />}
                    {s.title}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </nav>

      {allDone && current >= STEPS.length ? (
        <CompletionCard onReview={() => goTo(0)} />
      ) : (
        <article className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <p className="text-xs font-medium text-primary">
            {current + 1} / {STEPS.length}
          </p>
          <h2 className="mt-1 text-xl font-semibold text-foreground sm:text-2xl">{step.title}</h2>

          <dl
            className={`mt-6 grid grid-cols-1 gap-3 ${
              step.kpis.length === 3
                ? "sm:grid-cols-3"
                : step.kpis.length === 2
                  ? "sm:grid-cols-2"
                  : ""
            }`}
          >
            {step.kpis.map((k) => (
              <div
                key={k.label}
                className={`rounded-xl border p-5 ${
                  k.emphasis ? "border-primary/40 bg-primary/5" : "border-border bg-secondary/30"
                }`}
              >
                <dt className="text-xs text-muted-foreground">{k.label}</dt>
                <dd className="mt-2 flex items-baseline gap-1">
                  <span
                    className={`font-mono text-3xl font-semibold tabular-nums sm:text-4xl ${
                      k.emphasis ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {k.value}
                  </span>
                  {k.unit && <span className="text-sm text-muted-foreground">{k.unit}</span>}
                </dd>
              </div>
            ))}
          </dl>

          <p className="mt-6 text-pretty text-base font-medium leading-relaxed text-foreground sm:text-lg">
            {step.conclusion}
          </p>
          {step.action && (
            <p className="mt-2 flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
              <Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              {step.action}
            </p>
          )}

          <button
            onClick={() => setShowDetail((v) => !v)}
            aria-expanded={showDetail}
            className="mt-6 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            상세 데이터 {showDetail ? "접기" : "보기"}
            <ChevronDown
              className={`size-3.5 transition-transform ${showDetail ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </button>
          {showDetail && <div className="mt-3">{step.detail}</div>}

          <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-5">
            <button
              onClick={() => goTo(current - 1)}
              disabled={current === 0}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:invisible"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              이전
            </button>
            <button
              onClick={approve}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Check className="size-4" aria-hidden="true" />
              {current === STEPS.length - 1 ? "승인하고 분석 완료" : "승인하고 다음"}
            </button>
          </div>
        </article>
      )}
    </div>
  )
}

function CompletionCard({ onReview }: { onReview: () => void }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-primary/30 bg-card p-8 text-center sm:p-10">
      <span className="flex size-12 items-center justify-center rounded-full bg-success/15 text-success">
        <CheckCircle2 className="size-6" aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-xl font-semibold text-foreground">분석 {STEPS.length}개 항목 승인 완료</h2>
      <ul className="mt-6 grid w-full max-w-lg grid-cols-1 gap-2 text-left text-sm sm:grid-cols-3">
        <li className="rounded-lg bg-secondary/40 p-3">
          <p className="text-xs text-muted-foreground">골든존 대상</p>
          <p className="mt-1 font-mono font-semibold text-foreground">A등급 47 SKU</p>
        </li>
        <li className="rounded-lg bg-secondary/40 p-3">
          <p className="text-xs text-muted-foreground">FIFO 개선 필요</p>
          <p className="mt-1 font-mono font-semibold text-foreground">16.7% 체류</p>
        </li>
        <li className="rounded-lg bg-secondary/40 p-3">
          <p className="text-xs text-muted-foreground">필요 보관량</p>
          <p className="mt-1 font-mono font-semibold text-primary">
            {STORAGE_SIZING.requiredPlt.toLocaleString()} PLT
          </p>
        </li>
      </ul>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={onReview}
          className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          다시 검토
        </button>
        <Link
          href="/analysis/layout"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          설계 반영으로 이동
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}
