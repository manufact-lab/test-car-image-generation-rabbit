import type { Axis, SlotGrade, GradeResult } from "@/lib/reslotting"
import { GRADE_DEPTH_LABEL } from "@/lib/reslotting"

const AXIS_STYLE: Record<Axis, string> = {
  A: "bg-primary/15 text-primary border-primary/30",
  B: "bg-warning/15 text-warning border-warning/30",
  C: "bg-muted text-muted-foreground border-border",
}

const GRADE_STYLE: Record<SlotGrade, string> = {
  S: "bg-primary text-primary-foreground border-transparent",
  A: "bg-primary/15 text-primary border-primary/30",
  B: "bg-warning/15 text-warning border-warning/30",
  C: "bg-muted text-muted-foreground border-border",
}

// 물량축 / 빈도축을 나란히 보여주는 Cross-ABC 뱃지
export function CrossAbcBadge({ grade }: { grade: GradeResult }) {
  return (
    <div className="inline-flex items-center gap-1">
      <span
        className={`inline-flex items-center rounded border px-1.5 py-0.5 text-xs font-medium ${AXIS_STYLE[grade.volume]}`}
        title="물량 등급 (하루 출고 수량)"
      >
        물량 {grade.volume}
      </span>
      <span className="text-muted-foreground">·</span>
      <span
        className={`inline-flex items-center rounded border px-1.5 py-0.5 text-xs font-medium ${AXIS_STYLE[grade.freq]}`}
        title="빈도 등급 (하루 피킹 횟수)"
      >
        빈도 {grade.freq}
      </span>
      {grade.isMismatch && (
        <span
          className="inline-flex items-center rounded border border-destructive/40 bg-destructive/15 px-1.5 py-0.5 text-xs font-medium text-destructive"
          title="물량축과 빈도축이 크게 어긋남"
        >
          괴리
        </span>
      )}
    </div>
  )
}

export function SlotGradeBadge({ grade }: { grade: SlotGrade }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-semibold ${GRADE_STYLE[grade]}`}
      title={`슬롯 등급 ${grade} → ${GRADE_DEPTH_LABEL[grade]}`}
    >
      <span>{grade}급</span>
      <span className="font-normal opacity-80">{GRADE_DEPTH_LABEL[grade]}</span>
    </span>
  )
}
