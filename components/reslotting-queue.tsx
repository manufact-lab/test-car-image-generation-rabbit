"use client"

import { useReslotting, type QueueDecision } from "@/components/reslotting-context"
import { CrossAbcBadge, SlotGradeBadge } from "@/components/grade-badge"
import { type ReslottingCandidate } from "@/lib/reslotting"

const DECISION_LABEL: Record<QueueDecision, string> = {
  pending: "대기",
  approved: "승인됨",
  held: "보류됨",
  applied: "이동 완료",
}

const DECISION_STYLE: Record<QueueDecision, string> = {
  pending: "bg-muted text-muted-foreground",
  approved: "bg-primary/15 text-primary",
  held: "bg-warning/15 text-warning",
  applied: "bg-success/15 text-success",
}

export function ReslottingQueue() {
  const { candidates, decisions, approve, hold, apply } = useReslotting()

  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">리슬롯팅 큐</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            주문 유입에 따른 물량·빈도 변동으로 재평가된 슬롯 이동 후보 · 변동 건 우선, 이동 개선폭순
          </p>
        </div>
        <span className="rounded-md bg-secondary px-2 py-1 text-xs font-medium tabular-nums text-secondary-foreground">
          {candidates.length}건
        </span>
      </div>

      {candidates.length === 0 ? (
        <div className="px-5 py-12 text-center text-sm text-muted-foreground">
          모든 SKU가 권장 depth에 배치되어 있습니다. 주문을 주입하면 재평가됩니다.
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {candidates.map((c) => (
            <QueueItem
              key={c.row.skuId}
              cand={c}
              decision={decisions[c.row.skuId] ?? "pending"}
              onApprove={() => approve(c.row.skuId)}
              onHold={() => hold(c.row.skuId)}
              onApply={() => apply(c.row.skuId)}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

function QueueItem({
  cand,
  decision,
  onApprove,
  onHold,
  onApply,
}: {
  cand: ReslottingCandidate
  decision: QueueDecision
  onApprove: () => void
  onHold: () => void
  onApply: () => void
}) {
  const { row, grade, currentDepth, targetDepth, direction, reason, gradeChanged } = cand
  const applied = decision === "applied"

  return (
    <li className="px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-foreground">{row.skuId}</span>
            <SlotGradeBadge grade={grade.finalGrade} />
          </div>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">{row.partName}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <CrossAbcBadge grade={grade} />
            <span
              className={`inline-flex items-center rounded border px-1.5 py-0.5 text-xs font-medium ${
                gradeChanged
                  ? "border-primary/40 bg-primary/15 text-primary"
                  : "border-border bg-muted text-muted-foreground"
              }`}
              title="리슬롯팅 사유"
            >
              {reason}
            </span>
          </div>
        </div>

        <span
          className={`shrink-0 rounded-md px-2 py-1 text-xs font-medium ${DECISION_STYLE[decision]}`}
        >
          {DECISION_LABEL[decision]}
        </span>
      </div>

      {/* depth 이동 시각화 */}
      <div className="mt-3 flex items-center gap-2 text-sm">
        <span className="rounded-md border border-border bg-secondary px-2 py-1 font-mono text-xs text-secondary-foreground">
          {currentDepth}-Deep
        </span>
        <span aria-hidden className={direction === "forward" ? "text-primary" : "text-warning"}>
          {direction === "forward" ? "→ 전면(얕게)" : "→ 후면(깊게)"}
        </span>
        <span
          className={`rounded-md border px-2 py-1 font-mono text-xs ${
            applied
              ? "border-success/40 bg-success/15 text-success"
              : "border-primary/40 bg-primary/15 text-primary"
          }`}
        >
          {targetDepth}-Deep
        </span>
      </div>

      {/* 적용된 예외 룰 */}
      {grade.appliedRules.length > 0 && (
        <div className="mt-3 space-y-1 rounded-md bg-secondary/50 p-2.5">
          {grade.appliedRules.map((r) => (
            <div key={r.id} className="flex items-start gap-2 text-xs">
              <span className="mt-0.5 shrink-0 rounded bg-primary/15 px-1.5 py-0.5 font-medium text-primary">
                {r.label}
              </span>
              <span className="text-muted-foreground">{r.effect}</span>
            </div>
          ))}
        </div>
      )}

      {/* 액션 */}
      <div className="mt-3 flex items-center gap-2">
        {applied ? (
          <span className="text-xs text-success">이동이 반영되었습니다. 창고맵에서 확인하세요.</span>
        ) : (
          <>
            <button
              onClick={onApprove}
              disabled={decision === "approved"}
              className="rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
            >
              승인
            </button>
            <button
              onClick={onHold}
              disabled={decision === "held"}
              className="rounded-md border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground transition-colors hover:bg-accent disabled:opacity-50"
            >
              보류
            </button>
            <button
              onClick={onApply}
              disabled={decision !== "approved"}
              title={decision !== "approved" ? "승인 후 실행할 수 있습니다" : undefined}
              className="ml-auto rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              이동 실행
            </button>
          </>
        )}
      </div>
    </li>
  )
}
