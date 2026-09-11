// recharts 공용 테마 (디자인 토큰 기반)
export const AXIS_TICK = { fill: "var(--color-muted-foreground)", fontSize: 11 }
export const AXIS_LINE = { stroke: "var(--color-border)" }
export const GRID_STROKE = "var(--color-border)"

export const tooltipProps = {
  cursor: { fill: "var(--color-secondary)", opacity: 0.4 },
  contentStyle: {
    background: "var(--color-popover)",
    border: "1px solid var(--color-border)",
    borderRadius: 8,
    fontSize: 12,
    color: "var(--color-popover-foreground)",
  },
  labelStyle: { color: "var(--color-foreground)" },
}
