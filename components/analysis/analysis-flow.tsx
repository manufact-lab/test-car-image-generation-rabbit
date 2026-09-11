"use client"

import { useState, useRef, useCallback } from "react"
import Link from "next/link"
import {
  Upload,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  Sparkles,
} from "lucide-react"
import {
  PROCESSING_STEPS,
  CLEANSING_TOTAL,
  RAW_LINE_COUNT,
  KEPT_LINE_COUNT,
} from "@/lib/analysis-data"
import { CleansingSection } from "./cleansing-section"
import { DailyTrendSection } from "./daily-trend-section"
import { AbcSection } from "./abc-section"
import { ShippingDaysSection } from "./shipping-days-section"
import { GapSection } from "./gap-section"
import { GapByGradeSection } from "./gap-by-grade-section"
import { LinesPerSkuSection } from "./lines-per-sku-section"

type Phase = "idle" | "processing" | "done"

export function AnalysisFlow() {
  const [phase, setPhase] = useState<Phase>("idle")
  const [fileName, setFileName] = useState<string | null>(null)
  const [stepIdx, setStepIdx] = useState(0)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const runProcessing = useCallback(() => {
    setPhase("processing")
    setStepIdx(0)
    timers.current.forEach(clearTimeout)
    timers.current = []
    PROCESSING_STEPS.forEach((_, i) => {
      const t = setTimeout(
        () => {
          if (i === PROCESSING_STEPS.length - 1) {
            setStepIdx(i)
            const done = setTimeout(() => setPhase("done"), 600)
            timers.current.push(done)
          } else {
            setStepIdx(i)
          }
        },
        (i + 1) * 650,
      )
      timers.current.push(t)
    })
  }, [])

  const onFile = useCallback(
    (file: File | undefined) => {
      setFileName(file ? file.name : "sample_출하데이터_2026Q1.xlsx")
      runProcessing()
    },
    [runProcessing],
  )

  const reset = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    setPhase("idle")
    setFileName(null)
    setStepIdx(0)
  }, [])

  if (phase === "done") {
    return (
      <div className="flex flex-col gap-5">
        {/* 리포트 헤더 */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-success/15 text-success">
              <CheckCircle2 className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">데이터 분석 완료</p>
              <p className="text-xs text-muted-foreground">
                <span className="font-mono">{fileName}</span> · 원본{" "}
                {CLEANSING_TOTAL.raw.toLocaleString()}건 → 분석 대상{" "}
                <span className="font-medium text-primary">
                  {CLEANSING_TOTAL.kept.toLocaleString()}건
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={reset}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              다시 업로드
            </button>
            <Link
              href="/optimizer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              최적화 대시보드로 이동
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* 분석 섹션 */}
        <CleansingSection />
        <DailyTrendSection />
        <AbcSection />
        <ShippingDaysSection />
        <GapSection />
        <GapByGradeSection />
        <LinesPerSkuSection />

        {/* 하단 CTA */}
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center">
          <p className="text-sm font-medium text-foreground">
            분석 결과를 바탕으로 창고 슬로팅을 최적화할 준비가 되었습니다.
          </p>
          <Link
            href="/optimizer"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            AI 재고 최적화 대시보드 열기
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    )
  }

  if (phase === "processing") {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center rounded-2xl border border-border bg-card p-8">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <Loader2 className="size-7 animate-spin" aria-hidden="true" />
        </span>
        <p className="mt-4 text-base font-semibold text-foreground">데이터 분석 중</p>
        <p className="mt-1 text-sm text-muted-foreground">
          <span className="font-mono">{fileName}</span>
        </p>

        <ol className="mt-6 w-full space-y-2.5">
          {PROCESSING_STEPS.map((step, i) => {
            const state = i < stepIdx ? "done" : i === stepIdx ? "active" : "todo"
            return (
              <li key={step} className="flex items-center gap-3">
                <span
                  className={`flex size-5 shrink-0 items-center justify-center rounded-full text-xs ${
                    state === "done"
                      ? "bg-success/15 text-success"
                      : state === "active"
                        ? "bg-primary/15 text-primary"
                        : "bg-secondary text-muted-foreground/50"
                  }`}
                >
                  {state === "done" ? (
                    <CheckCircle2 className="size-3.5" aria-hidden="true" />
                  ) : state === "active" ? (
                    <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    i + 1
                  )}
                </span>
                <span
                  className={`text-sm ${
                    state === "todo" ? "text-muted-foreground/50" : "text-foreground"
                  }`}
                >
                  {step}
                </span>
              </li>
            )
          })}
        </ol>

        <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${((stepIdx + 1) / PROCESSING_STEPS.length) * 100}%` }}
          />
        </div>
      </div>
    )
  }

  // idle: 업로드 화면
  return (
    <div className="mx-auto max-w-2xl">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          onFile(e.dataTransfer.files?.[0])
        }}
        className={`flex flex-col items-center rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
          dragging ? "border-primary bg-primary/5" : "border-border bg-card"
        }`}
      >
        <span className="flex size-16 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <Upload className="size-8" aria-hidden="true" />
        </span>
        <h2 className="mt-5 text-lg font-semibold text-foreground">출하 데이터 업로드</h2>
        <p className="mt-2 max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
          공장 출하 이력이 담긴 엑셀(.xlsx / .csv) 파일을 업로드하면, 데이터 클렌징부터 ABC 등급 산출,
          생산-출하 GAP까지 창고 최적화에 필요한 분석을 자동으로 수행합니다.
        </p>

        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0])}
        />

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <FileSpreadsheet className="size-4" aria-hidden="true" />
            엑셀 파일 선택
          </button>
          <button
            onClick={() => onFile(undefined)}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-secondary/40"
          >
            <Sparkles className="size-4 text-primary" aria-hidden="true" />
            샘플 데이터로 분석
          </button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground/70">
          또는 파일을 이곳에 끌어다 놓으세요
        </p>
      </div>

      {/* 안내: 어떤 분석이 나오는지 */}
      <div className="mt-5 rounded-xl border border-border bg-secondary/30 p-4">
        <p className="text-xs font-semibold text-foreground">분석 리포트 구성</p>
        <ul className="mt-2 grid grid-cols-1 gap-1.5 text-xs text-muted-foreground sm:grid-cols-2">
          <li>· 데이터 클렌징 개요 ({RAW_LINE_COUNT}라인 → {KEPT_LINE_COUNT}라인)</li>
          <li>· 일자별 SKU / 출하 건수 추이</li>
          <li>· SKU별 ABC 분석 (파레토)</li>
          <li>· 등급별 출하일수 분석</li>
          <li>· 생산-출하일자 GAP 분석</li>
          <li>· 등급별 GAP · 출하 라인 수 분석</li>
        </ul>
      </div>
    </div>
  )
}
