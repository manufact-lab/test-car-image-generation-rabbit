import Image from "next/image"
import { type VehicleType, VEHICLE_LABELS } from "@/lib/inventory-data"

const IMAGES: Record<VehicleType, string> = {
  sedan: "/vehicles/sedan.png",
  suv: "/vehicles/suv.png",
  truck: "/vehicles/truck.png",
  van: "/vehicles/van.png",
  hatchback: "/vehicles/hatchback.png",
}

export function VehicleIcons({
  vehicles,
  compact = false,
}: {
  vehicles: VehicleType[]
  compact?: boolean
}) {
  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <div className="flex items-center -space-x-2">
          {vehicles.map((v) => (
            <div
              key={v}
              title={VEHICLE_LABELS[v]}
              className="relative h-8 w-12 overflow-hidden rounded-md border border-border bg-secondary ring-1 ring-background"
            >
              <Image
                src={IMAGES[v] || "/placeholder.svg"}
                alt={VEHICLE_LABELS[v]}
                fill
                sizes="48px"
                className="object-cover"
              />
            </div>
          ))}
        </div>
        <span className="text-xs text-muted-foreground">
          {vehicles.map((v) => VEHICLE_LABELS[v]).join(" · ")}
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {vehicles.map((v) => (
        <div
          key={v}
          className="flex flex-col items-center gap-1"
          title={VEHICLE_LABELS[v]}
        >
          <div className="relative h-14 w-24 overflow-hidden rounded-md border border-border bg-secondary">
            <Image
              src={IMAGES[v] || "/placeholder.svg"}
              alt={VEHICLE_LABELS[v]}
              fill
              sizes="96px"
              className="object-cover"
            />
          </div>
          <span className="text-[11px] font-medium text-muted-foreground">
            {VEHICLE_LABELS[v]}
          </span>
        </div>
      ))}
    </div>
  )
}
