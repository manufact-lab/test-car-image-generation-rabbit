"use client"

import { useState } from "react"
import { WorkflowStepper } from "@/components/workflow-stepper"
import { AnalysisFlow, type AnalysisPhase } from "./analysis-flow"

export function AnalysisWorkspace() {
  const [phase, setPhase] = useState<AnalysisPhase>("idle")
  const isInput = phase === "idle"

  return (
    <>
      <WorkflowStepper current={isInput ? 1 : 2} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {isInput ? "출하 데이터 입력" : "출하 데이터 분석"}
          </h1>
          <p className="mt-2 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground">
            창고 최적화에 앞서, 실제 출하 이력을 분석해 SKU 등급·출하 패턴·생산-출하 GAP을 진단합니다.
            분석이 끝나면 브라운필드 배치 설계 → 공장 적용 순으로 진행합니다.
          </p>
        </div>

        <AnalysisFlow onPhaseChange={setPhase} />
      </main>
    </>
  )
}
