import { AlertTriangle, CircleCheck, MinusCircle } from "lucide-react"
import { type DosTier } from "@/lib/inventory-data"
import { cn } from "@/lib/utils"

const CONFIG: Record<
  DosTier,
  { label: string; className: string; Icon: typeof AlertTriangle }
> = {
  critical: {
    label: "위험 · 생산요청",
    className: "border-destructive/40 bg-destructive/15 text-destructive",
    Icon: AlertTriangle,
  },
  optimal: {
    label: "적정 · 유지",
    className: "border-warning/40 bg-warning/15 text-warning",
    Icon: MinusCircle,
  },
  stable: {
    label: "안정 · 입고대기",
    className: "border-success/40 bg-success/15 text-success",
    Icon: CircleCheck,
  },
}

export function StatusBadge({ tier }: { tier: DosTier }) {
  const { label, className, Icon } = CONFIG[tier]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium",
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {label}
    </span>
  )
}
