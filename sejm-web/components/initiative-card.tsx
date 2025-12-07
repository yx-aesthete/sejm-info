"use client"

import type { LegislativeProcess } from "@/lib/legislative-schema"
import { INITIATOR_COLORS } from "@/lib/legislative-schema"

interface InitiativeCardProps {
  process: LegislativeProcess
}

export function InitiativeCard({ process }: InitiativeCardProps) {
  const initiatorColor = INITIATOR_COLORS[process.initiator]
  const currentStage = process.timeline.find((n) => n.status === "current")
  const completedStages = process.timeline.filter((n) => n.status === "completed").length
  const totalStages = process.timeline.length
  const progress = Math.round((completedStages / totalStages) * 100)

  const statusLabels = {
    "in-progress": "W trakcie",
    completed: "Zakończony",
    rejected: "Odrzucony",
  }

  const statusColors = {
    "in-progress": "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  }

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: initiatorColor }} />
            <span className="text-xs text-muted-foreground">{process.initiatorName}</span>
          </div>
          <h2 className="font-bold text-lg text-foreground leading-tight">{process.shortTitle}</h2>
          <p className="text-sm text-muted-foreground mt-1">{process.documentNumber}</p>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[process.processStatus]}`}>
          {statusLabels[process.processStatus]}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Postęp procesu</span>
          <span>
            {completedStages}/{totalStages} etapów ({progress}%)
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${progress}%`, backgroundColor: initiatorColor }}
          />
        </div>
      </div>

      {currentStage && (
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="text-xs text-muted-foreground mb-1">Obecny etap</div>
          <div className="font-medium text-foreground">{currentStage.name}</div>
          {currentStage.description && <p className="text-sm text-muted-foreground mt-1">{currentStage.description}</p>}
        </div>
      )}

      {process.sourceUrl && (
        <a
          href={process.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block mt-4 text-xs text-primary hover:underline"
        >
          Zobacz w serwisie Sejmu →
        </a>
      )}
    </div>
  )
}
