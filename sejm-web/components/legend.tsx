"use client"

import { initiators } from "@/lib/legislative-data"

interface LegendProps {
  selectedInitiator: string
  onInitiatorChange: (initiator: string) => void
}

export function Legend({ selectedInitiator, onInitiatorChange }: LegendProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <h3 className="text-lg font-semibold mb-4">Wybierz inicjatora ustawy</h3>
      <div className="flex flex-wrap gap-3">
        {initiators.map((initiator) => (
          <button
            key={initiator.id}
            onClick={() => onInitiatorChange(initiator.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
              selectedInitiator === initiator.id
                ? "border-foreground bg-accent"
                : "border-border hover:border-muted-foreground"
            }`}
          >
            <div className="w-5 h-5 rounded-full" style={{ backgroundColor: initiator.color }} />
            <span className="text-sm font-medium">{initiator.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
