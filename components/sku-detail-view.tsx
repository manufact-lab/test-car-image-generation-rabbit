"use client"

import { useEffect } from "react"
import { X, MapPin, Box, Gauge, Factory } from "lucide-react"
import type { SkuRow } from "@/lib/inventory-data"
import {
  daysOfSupply,
  dosTier,
  abcClass,
  recommendedDepth,
  formatShipLine,
} from "@/lib/inventory-data"
import { StatusBadge } from "@/components/status-badge"
import { Chassis3D } from "@/components/chassis-3d"
import { WarehouseMap } from "@/components/warehouse-map"
import { DepthEfficiencyChart } from "@/components/depth-efficiency-chart"

function MetaItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Box
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-border bg-secondary/30 px-3 py-2.5">
      <Icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div className="truncate text-sm font-medium text-foreground">
          {value}
        </div>
      </div>
    </div>
  )
}

function SectionTitle({
  step,
  title,
  desc,
}: {
  step: string
  title: string
  desc: string
}) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-md bg-primary font-mono text-xs font-bold text-primary-foreground">
        {step}
      </span>
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  )
}

export function SkuDetailView({
  row,
  onClose,
}: {
  row: SkuRow
  onClose: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [onClose])

  const dos = daysOfSupply(row)
  const tier = dosTier(dos)
  const cls = abcClass(row)

  return (
    <div
      className="fixed inset-0 z-[60] flex justify-end bg-black/70 backdrop-blur-sm duration-200 animate-in fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${row.skuId} 상세 보기`}
    >
      <div
        className="flex h-full w-full max-w-3xl flex-col border-l border-border bg-background shadow-2xl duration-300 animate-in slide-in-from-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border p-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-lg font-semibold text-foreground">
                {row.skuId}
              </span>
              <StatusBadge tier={tier} />
              <span className="rounded-md border border-primary/40 bg-primary/10 px-2 py-0.5 font-mono text-xs font-medium text-primary">
                Class {cls}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              <span className="font-mono font-medium text-foreground">
                {row.doorTrim}
              </span>{" "}
              · 도어트림
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="닫기"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Scroll body */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* SECTION 1: metadata + 3D vehicle */}
          <section className="mb-8">
            <SectionTitle
              step="1"
              title="부품 정보 · 도어트림 장착 위치"
              desc="SKU 메타데이터와 차량 도어 상의 도어트림 장착 위치를 3D로 확인"
            />
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <MetaItem icon={Box} label="부품 (Part)" value="도어트림" />
                  <MetaItem
                    icon={Gauge}
                    label="Unit Weight"
                    value={`${row.weightKg} kg`}
                  />
                  <MetaItem
                    icon={MapPin}
                    label="장착 위치"
                    value={row.doorTrim}
                  />
                  <div className="flex items-center gap-2.5 rounded-lg border border-border bg-secondary/30 px-3 py-2.5">
                    <Factory className="size-4 shrink-0 text-primary" aria-hidden="true" />
                    <div className="min-w-0">
                      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        출하 라인
                      </div>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {row.shipLines.map((l, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center rounded-sm border border-primary/40 bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-medium text-primary"
                          >
                            {formatShipLine(l)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-secondary/30 p-3">
                  <div className="mb-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                    적용 차종
                  </div>
                  <span className="inline-flex items-center rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1 font-mono text-sm font-medium text-primary">
                    {row.modelName}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="rounded-lg border border-border bg-secondary/30 px-3 py-2.5">
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      재고
                    </div>
                    <div className="font-mono text-sm font-semibold text-foreground">
                      {row.inventory.toLocaleString()}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-secondary/30 px-3 py-2.5">
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      일 소요
                    </div>
                    <div className="font-mono text-sm font-semibold text-foreground">
                      {row.dailyOutflow.toLocaleString()}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-secondary/30 px-3 py-2.5">
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      재고일수
                    </div>
                    <div className="font-mono text-sm font-semibold text-foreground">
                      {dos === Infinity ? "∞" : `${dos.toFixed(1)}일`}
                    </div>
                  </div>
                </div>
              </div>
              <Chassis3D doorTrim={row.doorTrim} />
            </div>
          </section>

          {/* SECTION 2: warehouse map */}
          <section className="mb-8">
            <SectionTitle
              step="2"
              title="디지털 창고 맵"
              desc="정확한 Rack · Level · Aisle · Depth 위치 시각화"
            />
            <WarehouseMap location={row.location} />
          </section>

          {/* SECTION 3: efficiency vs depth */}
          <section>
            <SectionTitle
              step="3"
              title="피킹 효율 vs 적재 깊이 분석"
              desc="해당 존의 셔틀 깊이별 피킹 효율과 적재 밀도 트레이드오프"
            />
            <DepthEfficiencyChart row={row} />
            <div className="mt-3 rounded-lg border border-border bg-secondary/30 p-3 text-xs text-muted-foreground">
              현재 권장 셔틀 적재 깊이:{" "}
              <span className="font-mono font-semibold text-primary">
                {recommendedDepth(cls)}
              </span>{" "}
              (Class {cls} 기준)
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
