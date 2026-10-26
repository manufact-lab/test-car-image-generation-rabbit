"use client"

import { useState, useRef, useCallback } from "react"
import {
  Upload,
  FileSpreadsheet,
  Loader2,
  Sparkles,
} from "lucide-react"
import {
  PROCESSING_STEPS,
} from "@/lib/analysis-data"
import { AnalysisReview } from "./analysis-review"

export type AnalysisPhase = "idle" | "processing" | "done"

export function AnalysisFlow({
  onPhaseChange,
}: {
  onPhaseChange?: (phase: AnalysisPhase) => void
}) {
  const [phase, setPhaseState] = useState<AnalysisPhase>("idle")
  const setPhase = useCallback(
    (next: AnalysisPhase) => {
      setPhaseState(next)
      onPhaseChange?.(next)
    },
    [onPhaseChange],
  )
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
      setFileName(file ? file.name : "서연이화_울산공장_출하데이터.xlsx")
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
    return <AnalysisReview fileName={fileName} onReset={reset} />
  }

  if (phase === "processing") {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center rounded-2xl border border-border bg-card p-8">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <Loader2 className="size-7 animate-spin" aria-hidden="true" />
        </span>
        <p className="mt-4 text-base font-semibold text-foreground" role="status">
          데이터 분석 진행 중
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          <span className="font-mono">{fileName}</span>
        </p>

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
          공장 출하 이력이 담긴 엑셀(.xlsx / .csv) 파일을 업로드하면, 창고 최적화에 필요한
          데이터 분석을 자동으로 진행합니다.
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
            고객 데이터 입력
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
          <li>· 데이터 클린징</li>
          <li>· 일자별 SKU / 출하 건수 추이</li>
          <li>· SKU별 ABC 분석 (파레토)</li>
          <li>· 등급별 출하일수 분석</li>
          <li>· 생산-출하일자 GAP 분석</li>
          <li>· 등급별 GAP · 출하 라인 수 분석</li>
          <li>· 필요 보관량 산정 (PLT)</li>
        </ul>
      </div>
    </div>
  )
}
