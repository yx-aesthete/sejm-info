"use client"

import { X } from "lucide-react"
import { type LegislativeStage, getInitiatorColor, getInitiatorName } from "@/lib/legislative-data"
import { StageSymbol } from "./stage-symbol"

interface StageDetailsProps {
  stage: LegislativeStage
  initiator: string
  onClose: () => void
}

export function StageDetails({ stage, initiator, onClose }: StageDetailsProps) {
  const color = getInitiatorColor(initiator)

  return (
    <div className="bg-card rounded-xl border border-border p-6 relative">
      <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
        <X className="w-5 h-5" />
      </button>

      <div className="flex items-start gap-6">
        <div className="flex-shrink-0">
          <StageSymbol
            type={stage.symbolType}
            color={stage.symbolType === "end-negative" ? "#6b7280" : color}
            size={64}
          />
        </div>

        <div className="flex-1">
          <h3 className="text-xl font-semibold mb-2">{stage.name}</h3>
          <p className="text-muted-foreground mb-4">{stage.description}</p>

          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Typ symbolu:</span>{" "}
              <span className="text-muted-foreground">{stage.symbolDescription}</span>
            </div>
            <div>
              <span className="font-medium">Inicjator:</span>{" "}
              <span className="text-muted-foreground">{getInitiatorName(initiator)}</span>
            </div>
            <div>
              <span className="font-medium">Podstawa prawna:</span>{" "}
              <span className="text-muted-foreground">{stage.legalBasis}</span>
            </div>
            {stage.duration && (
              <div>
                <span className="font-medium">Typowy czas trwania:</span>{" "}
                <span className="text-muted-foreground">{stage.duration}</span>
              </div>
            )}
          </div>

          {stage.possibleOutcomes && (
            <div className="mt-4">
              <span className="font-medium text-sm">Możliwe rezultaty:</span>
              <ul className="mt-2 space-y-1">
                {stage.possibleOutcomes.map((outcome, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                    {outcome}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
