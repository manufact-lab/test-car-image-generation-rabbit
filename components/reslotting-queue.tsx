"use client"

import { useReslotting, type QueueDecision } from "@/components/reslotting-context"
import { CrossAbcBadge, SlotGradeBadge } from "@/components/grade-badge"
import {
  type ReslottingCandidate,
  type MoveVerdict,
  VERDICT_LABEL,
  formatMin,
  formatPayback,
} from "@/lib/reslotting"

const VERDICT_STYLE: Record<MoveVerdict, string> = {
  recommend: "border-primary/40 bg-primary/15 text-primary",
  review: "border-warning/40 bg-warning/15 text-warning",
  reject: "border-border bg-muted text-muted-foreground",
}

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
            이동 비용 차감 후 순이득이 나는 건만 표시 · 기각 건 제외 · Payback 빠른 순 정렬
          </p>
        </div>
        <span className="rounded-md bg-secondary px-2 py-1 text-xs font-medium tabular-nums text-secondary-foreground">
          {candidates.length}건
        </span>
      </div>

      {candidates.length === 0 ? (
        <div className="px-5 py-12 text-center text-sm text-muted-foreground">
          순이득이 나는 이동 후보가 없습니다. 권장 위치에 있거나, 이동 비용 대비 효과가 없어 모두
          기각되었습니다. 주문을 주입하면 재평가됩니다.
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

function CostChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="whitespace-nowrap">
      {label} <span className="font-medium tabular-nums text-foreground">{value}</span>
    </span>
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
  const { row, grade, currentDepth, targetDepth, direction, reason, gradeChanged, move, verdict } =
    cand
  const applied = decision === "applied"

  return (
    <li className="px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-foreground">{row.skuId}</span>
            <SlotGradeBadge grade={grade.finalGrade} />
            <span
              className={`inline-flex items-center rounded border px-1.5 py-0.5 text-xs font-semibold ${VERDICT_STYLE[verdict]}`}
              title="이동 비용 판정"
            >
              {VERDICT_LABEL[verdict]}
            </span>
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
          →
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

      {/* 이동 비용 요약 한 줄 */}
      <div className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground">
        <CostChip label="재취급" value={`${move.rehandlePallets}팔레트`} />
        <span aria-hidden>·</span>
        <CostChip
          label="셔틀"
          value={formatMin(
            move.breakdown.handleSec + move.breakdown.shuttleSec + move.breakdown.liftSec,
          )}
        />
        <span aria-hidden>·</span>
        <CostChip label="레인 차단" value={formatMin(move.breakdown.blockLossSec)} />
        <span aria-hidden>·</span>
        <CostChip label="Payback" value={formatPayback(move.paybackDays)} />
        <span aria-hidden>·</span>
        <span className="font-medium text-primary">
          순이득 {formatMin(move.netGainSec, true)}
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
