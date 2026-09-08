"use client"

import { cn } from "@/lib/utils"
import {
  type WarehouseLocation,
  LANE_ACCESS_LABEL,
  PICK_MODE_LABEL,
  availablePickModes,
  effectiveDepth,
} from "@/lib/inventory-data"

const RACK_COLS = 8
const LEVELS = 4 // rendered top (4) to bottom (1)
const ALL_PICK_MODES = ["flow-through", "dual-pick", "lifo"] as const

// 레인 끝단 표시: 통로 입구(접근 방향 화살표) 또는 벽(단면 레인의 막힌 면)
function LaneEnd({
  label,
  wall,
  arrow,
}: {
  label: string
  wall?: boolean
  arrow?: "left" | "right"
}) {
  return (
    <div className="flex w-7 shrink-0 flex-col items-center gap-1">
      <div
        className={cn(
          "flex h-9 w-full items-center justify-center rounded-[4px] border text-xs font-bold",
          wall
            ? "border-muted-foreground/40 bg-[repeating-linear-gradient(45deg,transparent,transparent_3px,var(--color-muted-foreground)_3px,var(--color-muted-foreground)_4px)] text-muted-foreground"
            : "border-dashed border-primary/50 bg-primary/5 text-primary",
        )}
        aria-hidden
      >
        {arrow === "right" ? "→" : arrow === "left" ? "←" : null}
      </div>
      <span className="text-[9px] text-muted-foreground">{label}</span>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-secondary/40 px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="font-mono text-sm font-semibold text-foreground">
        {value}
      </div>
    </div>
  )
}

export function WarehouseMap({
  location,
  targetDepth,
}: {
  location: WarehouseLocation
  targetDepth?: number
}) {
  const oneSided = location.laneAccess === "one-sided"
  const allowedModes = availablePickModes(location.laneAccess)

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Zone" value={location.zone} />
        <Stat label="Aisle" value={location.aisle} />
        <Stat label="Rack" value={`R-${String(location.rack).padStart(2, "0")}`} />
        <Stat label="Level" value={`L${location.level}`} />
        <Stat label="접근유형" value={LANE_ACCESS_LABEL[location.laneAccess]} />
        <Stat
          label="유효깊이"
          value={`${effectiveDepth(location)} / ${location.laneLength}`}
        />
      </div>

      {/* Rack elevation grid: rows = levels, cols = rack bays */}
      <div className="rounded-lg border border-border bg-[#0c0c0c] p-4">
        <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>{location.aisle} · Rack Elevation</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-[3px] bg-primary" />
            Target bin
          </span>
        </div>

        <div className="flex gap-2">
          {/* Level labels */}
          <div className="flex flex-col justify-between py-1 text-[10px] text-muted-foreground">
            {Array.from({ length: LEVELS }, (_, i) => (
              <span key={i} className="font-mono">
                L{LEVELS - i}
              </span>
            ))}
          </div>

          <div className="flex-1">
            <div className="grid grid-rows-4 gap-1.5">
              {Array.from({ length: LEVELS }, (_, r) => {
                const level = LEVELS - r
                return (
                  <div
                    key={level}
                    className="grid gap-1.5"
                    style={{
                      gridTemplateColumns: `repeat(${RACK_COLS}, minmax(0, 1fr))`,
                    }}
                  >
                    {Array.from({ length: RACK_COLS }, (_, c) => {
                      const rack = c + 1
                      const isTarget =
                        rack === location.rack && level === location.level
                      // Deterministic pseudo-occupancy for visual texture
                      const occupied = (rack * 7 + level * 3) % 5 !== 0
                      return (
                        <div
                          key={rack}
                          className={cn(
                            "relative aspect-[4/3] rounded-[4px] border transition-colors",
                            isTarget
                              ? "border-primary bg-primary shadow-[0_0_18px_-2px_var(--color-primary)]"
                              : occupied
                                ? "border-border bg-secondary/60"
                                : "border-dashed border-border/60 bg-transparent",
                          )}
                        >
                          {isTarget && (
                            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-primary-foreground">
                              SKU
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
            {/* Rack column labels */}
            <div
              className="mt-1.5 grid gap-1.5 text-center text-[10px] text-muted-foreground"
              style={{
                gridTemplateColumns: `repeat(${RACK_COLS}, minmax(0, 1fr))`,
              }}
            >
              {Array.from({ length: RACK_COLS }, (_, c) => (
                <span key={c} className="font-mono">
                  {c + 1}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-3 border-t border-border pt-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>4-Way Shuttle Lane · Depth Position</span>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-medium",
                oneSided
                  ? "border-warning/50 bg-warning/15 text-warning"
                  : "border-primary/40 bg-primary/15 text-primary",
              )}
            >
              {LANE_ACCESS_LABEL[location.laneAccess]} 접근
            </span>
          </div>

          <div className="flex items-stretch gap-1.5">
            {/* 근거리 통로 입구 (양쪽 공통) */}
            <LaneEnd label="입구" arrow="right" />

            {Array.from({ length: location.laneLength }, (_, i) => {
              const depth = i + 1
              const isCurrent = depth === location.depth
              const isTarget = targetDepth !== undefined && depth === targetDepth
              const isBoth = isCurrent && isTarget
              // 유효깊이: 양면=가까운 쪽 기준 min(), 단면=위치 그대로
              const effEach = oneSided
                ? depth
                : Math.min(depth, location.laneLength + 1 - depth)
              const maxEff = oneSided
                ? location.laneLength
                : Math.ceil(location.laneLength / 2)
              const effortRatio = effEach / maxEff
              return (
                <div key={depth} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className={cn(
                      "relative flex h-9 w-full items-center justify-center overflow-hidden rounded-[4px] border",
                      isBoth
                        ? "border-success bg-success/25"
                        : isCurrent
                          ? "border-primary bg-primary/25"
                          : isTarget
                            ? "border-warning border-dashed bg-warning/15"
                            : "border-border bg-secondary/40",
                    )}
                    title={`위치 D${depth} · 유효깊이 ${effEach}`}
                  >
                    {/* 접근 난이도: 유효깊이가 깊을수록 채움이 높다 */}
                    {!isCurrent && !isTarget && (
                      <div
                        className="absolute inset-x-0 bottom-0 bg-muted-foreground/15"
                        style={{ height: `${Math.round(effortRatio * 100)}%` }}
                        aria-hidden
                      />
                    )}
                    <span className="relative z-10 font-mono text-[10px] font-semibold text-foreground/80">
                      {isCurrent ? (
                        <span className="text-primary">현재</span>
                      ) : isTarget ? (
                        <span className="text-warning">권장</span>
                      ) : (
                        effEach
                      )}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground">D{depth}</span>
                </div>
              )
            })}

            {/* 원거리 끝: 단면=벽(막힘), 양면=반대편 통로 입구 */}
            {oneSided ? <LaneEnd label="벽" wall /> : <LaneEnd label="입구" arrow="left" />}
          </div>

          {/* 범례: 셀 안 숫자 = 유효깊이(접근 노력), 채움 높이 = 난이도 */}
          <p className="mt-1.5 text-[10px] text-muted-foreground/80">
            셀 안 숫자 = 유효깊이(작을수록 빠름) · 채움 높이 = 접근 난이도
            {!oneSided && " · 양면은 양쪽 입구에서 접근해 가운데가 가장 깊습니다"}
          </p>

          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
            {oneSided ? (
              <>
                단면 레인: 한쪽 통로에서만 접근 가능하며 반대쪽은 벽으로 막혀 있습니다. 구조상 후입선출
                <span className="text-warning"> (LIFO 고정)</span>이라 유효 깊이 = 위치 그대로
                <span className="font-mono text-foreground"> D{effectiveDepth(location)}</span>.
              </>
            ) : (
              <>
                양면 레인: 양쪽 통로에서 접근하므로 가까운 쪽 기준 유효 깊이 = min(위치, 레인길이+1−위치) ={" "}
                <span className="font-mono text-foreground">D{effectiveDepth(location)}</span>.
              </>
            )}
            {targetDepth !== undefined && targetDepth !== location.depth && (
              <>
                {" "}
                <span className="text-warning">
                  권장 위치(D{targetDepth})로 이동 시 피킹 효율이 개선됩니다.
                </span>
              </>
            )}
          </p>

          {/* 운영 모드: 단면은 flow-through 비활성 */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              운영 모드
            </span>
            {ALL_PICK_MODES.map((mode) => {
              const enabled = allowedModes.includes(mode)
              return (
                <span
                  key={mode}
                  className={cn(
                    "rounded border px-1.5 py-0.5 text-[10px] font-medium",
                    enabled
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border bg-secondary/30 text-muted-foreground/50 line-through",
                  )}
                  title={enabled ? "선택 가능" : "이 레인 구조에서는 사용 불가"}
                >
                  {PICK_MODE_LABEL[mode]}
                </span>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
