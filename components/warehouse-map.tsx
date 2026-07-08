"use client"

import { cn } from "@/lib/utils"
import type { WarehouseLocation } from "@/lib/inventory-data"

const RACK_COLS = 8
const LEVELS = 4 // rendered top (4) to bottom (1)

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

export function WarehouseMap({ location }: { location: WarehouseLocation }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Zone" value={location.zone} />
        <Stat label="Aisle" value={location.aisle} />
        <Stat label="Rack" value={`R-${String(location.rack).padStart(2, "0")}`} />
        <Stat label="Level" value={`L${location.level}`} />
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
          <div className="mb-2 text-xs text-muted-foreground">
            4-Way Shuttle Lane · Depth Position
          </div>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: 5 }, (_, i) => {
              const depth = i + 1
              const isCurrent = depth === location.depth
              return (
                <div key={depth} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className={cn(
                      "h-8 w-full rounded-[4px] border",
                      isCurrent
                        ? "border-primary bg-primary/25"
                        : "border-border bg-secondary/40",
                    )}
                  >
                    {isCurrent && (
                      <div className="flex h-full items-center justify-center text-[10px] font-bold text-primary">
                        HERE
                      </div>
                    )}
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    D{depth}
                  </span>
                </div>
              )
            })}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Aisle mouth is D1 (fastest to pick). Higher depth stores more pallets
            but requires shuttle shuffles to retrieve.
          </p>
        </div>
      </div>
    </div>
  )
}
