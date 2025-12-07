"use client"

import { type LegislativeStage, getInitiatorColor } from "@/lib/legislative-data"
import { StageSymbol } from "./stage-symbol"

interface ProcessTimelineProps {
  stages: LegislativeStage[]
  initiator: string
  onStageSelect: (stage: LegislativeStage) => void
  selectedStage: LegislativeStage | null
}

export function ProcessTimeline({ stages, initiator, onStageSelect, selectedStage }: ProcessTimelineProps) {
  const color = getInitiatorColor(initiator)

  // Group stages by branch
  const mainPath = stages.filter((s) => s.branch === "main")
  const senatePath = stages.filter((s) => s.branch === "senate")
  const presidentPath = stages.filter((s) => s.branch === "president")
  const alternativePath = stages.filter((s) => s.branch === "alternative")

  return (
    <div className="min-w-[1200px]">
      {/* Main Sejm path */}
      <div className="mb-2">
        <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Sejm</div>
        <div className="flex items-center">
          {mainPath.map((stage, index) => (
            <div key={stage.id} className="flex items-center">
              <button
                onClick={() => onStageSelect(stage)}
                className={`relative transition-transform hover:scale-110 ${
                  selectedStage?.id === stage.id ? "scale-110" : ""
                }`}
              >
                <StageSymbol
                  type={stage.symbolType}
                  color={color}
                  isOptional={stage.isOptional}
                  size={stage.symbolType === "start" ? 48 : 56}
                />
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] text-muted-foreground max-w-[80px] text-center leading-tight">
                  {stage.shortName}
                </div>
              </button>
              {index < mainPath.length - 1 && <div className="w-8 h-0.5 bg-border mx-1" />}
            </div>
          ))}
        </div>
      </div>

      {/* Senate branch */}
      <div className="ml-[420px] mt-10 mb-2">
        <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Senat</div>
        <div className="flex items-center">
          {senatePath.map((stage, index) => (
            <div key={stage.id} className="flex items-center">
              <button
                onClick={() => onStageSelect(stage)}
                className={`relative transition-transform hover:scale-110 ${
                  selectedStage?.id === stage.id ? "scale-110" : ""
                }`}
              >
                <StageSymbol type={stage.symbolType} color={color} isOptional={stage.isOptional} size={56} />
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] text-muted-foreground max-w-[80px] text-center leading-tight">
                  {stage.shortName}
                </div>
              </button>
              {index < senatePath.length - 1 && <div className="w-8 h-0.5 bg-border mx-1" />}
            </div>
          ))}
        </div>
      </div>

      {/* President branch */}
      <div className="ml-[680px] mt-10 mb-2">
        <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Prezydent</div>
        <div className="flex items-center">
          {presidentPath.map((stage, index) => (
            <div key={stage.id} className="flex items-center">
              <button
                onClick={() => onStageSelect(stage)}
                className={`relative transition-transform hover:scale-110 ${
                  selectedStage?.id === stage.id ? "scale-110" : ""
                }`}
              >
                <StageSymbol type={stage.symbolType} color={color} isOptional={stage.isOptional} size={56} />
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] text-muted-foreground max-w-[80px] text-center leading-tight">
                  {stage.shortName}
                </div>
              </button>
              {index < presidentPath.length - 1 && <div className="w-8 h-0.5 bg-border mx-1" />}
            </div>
          ))}
        </div>
      </div>

      {/* Alternative endings */}
      <div className="ml-[900px] mt-10">
        <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
          Zakończenia alternatywne
        </div>
        <div className="flex items-center gap-6">
          {alternativePath.map((stage) => (
            <button
              key={stage.id}
              onClick={() => onStageSelect(stage)}
              className={`relative transition-transform hover:scale-110 ${
                selectedStage?.id === stage.id ? "scale-110" : ""
              }`}
            >
              <StageSymbol
                type={stage.symbolType}
                color={stage.symbolType === "end-negative" ? "#6b7280" : color}
                isOptional={stage.isOptional}
                size={48}
              />
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] text-muted-foreground max-w-[80px] text-center leading-tight">
                {stage.shortName}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
