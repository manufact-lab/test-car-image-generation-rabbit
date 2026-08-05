"use client"

import { useState } from "react"
import { OverviewCards } from "@/components/overview-cards"
import { InventoryTable } from "@/components/inventory-table"
import { AiOptimizer } from "@/components/ai-optimizer"
import { ReslottingQueue } from "@/components/reslotting-queue"
import { RuleSettings } from "@/components/rule-settings"
import { OrderInjector } from "@/components/order-injector"
import { SlottingAlert } from "@/components/slotting-alert"
import { useReslotting } from "@/components/reslotting-context"

type TabKey = "dashboard" | "queue"

const TABS: { key: TabKey; label: string }[] = [
  { key: "dashboard", label: "대시보드" },
  { key: "queue", label: "리슬롯팅 큐" },
]

export function DashboardTabs() {
  const [tab, setTab] = useState<TabKey>("dashboard")
  const { pendingCount } = useReslotting()

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div
          role="tablist"
          aria-label="대시보드 뷰 전환"
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-card p-1"
        >
          {TABS.map((t) => {
            const active = tab === t.key
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.key)}
                className={`relative rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
                {t.key === "queue" && pendingCount > 0 && (
                  <span
                    className={`ml-2 inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-semibold tabular-nums ${
                      active
                        ? "bg-primary-foreground/15 text-primary-foreground"
                        : "bg-warning/20 text-warning"
                    }`}
                  >
                    {pendingCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <OrderInjector />
      </div>

      {tab === "dashboard" ? (
        <div>
          <OverviewCards />
          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
            <div className="min-w-0">
              <InventoryTable />
            </div>
            <div className="min-w-0">
              <AiOptimizer />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
          <div className="min-w-0">
            <ReslottingQueue />
          </div>
          <div className="min-w-0">
            <RuleSettings />
          </div>
        </div>
      )}

      {tab === "dashboard" && <SlottingAlert onReview={() => setTab("queue")} />}
    </div>
  )
}
