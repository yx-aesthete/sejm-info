"use client"

import { useState, useMemo } from "react"
import { StageSymbol } from "./stage-symbol"
import { EXAMPLE_PROCESSES, type TimelineNode } from "@/lib/legislative-schema"

const SYMBOL_SIZE = 56
const MIN_GAP = 60 // Minimum gap between symbols for the connecting line

const INSTITUTION_COLORS: Record<string, { bg: string; border: string; label: string }> = {
  sejm: { bg: "#fee2e2", border: "#dc2626", label: "Sejm" },
  senat: { bg: "#dbeafe", border: "#2563eb", label: "Senat" },
  prezydent: { bg: "#f3e8ff", border: "#7c3aed", label: "Prezydent" },
  trybunal: { bg: "#ffedd5", border: "#ea580c", label: "Trybunał Konstytucyjny" },
  publikacja: { bg: "#dcfce7", border: "#16a34a", label: "Publikacja" },
}

function daysBetween(start: string, end: string): number {
  const startDate = new Date(start)
  const endDate = new Date(end)
  return Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
}

function getSymbolType(shape: string): "start" | "reading" | "work" | "decision" | "end" | "rejected" {
  switch (shape) {
    case "circle":
      return "start"
    case "rectangle":
      return "reading"
    case "rounded-rectangle":
      return "work"
    case "diamond":
      return "decision"
    case "circle-double":
      return "end"
    case "circle-x":
      return "rejected"
    default:
      return "work"
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString("pl-PL", { day: "numeric", month: "short" })
}

function formatFullDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export function GanttTimeline() {
  const [selectedProcessId, setSelectedProcessId] = useState(EXAMPLE_PROCESSES[0].id)
  const [scale, setScale] = useState(1)
  const [showPrediction, setShowPrediction] = useState(true)
  const [selectedNode, setSelectedNode] = useState<TimelineNode | null>(null)
  const [hoveredDateIdx, setHoveredDateIdx] = useState<number | null>(null)

  const selectedProcess = EXAMPLE_PROCESSES.find((p) => p.id === selectedProcessId) || EXAMPLE_PROCESSES[0]

  const processedTimeline = useMemo(() => {
    return selectedProcess.timeline.map((node, idx, arr) => {
      const duration = daysBetween(node.dateStart, node.dateEnd)
      let daysToNext = 0
      if (idx < arr.length - 1) {
        const nextNode = arr[idx + 1]
        daysToNext = daysBetween(node.dateEnd, nextNode.dateStart)
      }
      return {
        ...node,
        duration,
        daysToNext,
      }
    })
  }, [selectedProcess])

  // Find current stage index for NOW line
  const currentStageIndex = useMemo(() => {
    return processedTimeline.findIndex((node) => node.status === "current")
  }, [processedTimeline])

  // Gap width based on days (scaled, with minimum)
  const getGapWidth = (days: number) => {
    return Math.max(MIN_GAP, days * 8 * scale)
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-foreground">Ustawa:</label>
          <select
            value={selectedProcessId}
            onChange={(e) => setSelectedProcessId(e.target.value)}
            className="px-3 py-1.5 rounded-md border border-input bg-background text-sm"
          >
            {EXAMPLE_PROCESSES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-foreground">Rozstaw:</label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={scale}
            onChange={(e) => setScale(Number(e.target.value))}
            className="w-32"
          />
          <span className="text-sm text-muted-foreground">{Math.round(scale * 100)}%</span>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showPrediction}
            onChange={(e) => setShowPrediction(e.target.checked)}
            className="rounded border-input"
          />
          <span className="text-sm font-medium">Widok predykcyjny</span>
        </label>
      </div>

      {/* Timeline Container - using FLEXBOX like symbolic view */}
      <div className="overflow-x-auto bg-card rounded-lg border border-border p-8">
        <div className="min-w-max">
          {/* Main timeline row */}
          <div className="flex items-start">
            {processedTimeline.map((node, idx) => {
              const colors = INSTITUTION_COLORS[node.institution]
              const symbolType = getSymbolType(node.shape)
              const isFuture = node.status === "future" || node.status === "alternative"
              const isCurrent = node.status === "current"
              const isLast = idx === processedTimeline.length - 1
              const gapWidth = getGapWidth(node.daysToNext)

              return (
                <div key={node.id} className="flex items-start">
                  {/* Symbol column */}
                  <div
                    className="flex flex-col items-center relative"
                    style={{
                      opacity: showPrediction && isFuture ? 0.5 : 1,
                      filter: showPrediction && isFuture ? "grayscale(30%)" : "none",
                    }}
                  >
                    {/* NOW line */}
                    {showPrediction && isCurrent && (
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex flex-col items-center z-20">
                        <div className="bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 rounded whitespace-nowrap">
                          TERAZ
                        </div>
                        <div className="w-0.5 h-4 bg-red-600" />
                      </div>
                    )}

                    {/* Symbol */}
                    <button
                      onClick={() => setSelectedNode(node)}
                      className={`relative transition-transform hover:scale-110 ${
                        selectedNode?.id === node.id ? "scale-110 ring-2 ring-offset-2 ring-primary rounded-full" : ""
                      }`}
                      style={{ width: SYMBOL_SIZE, height: SYMBOL_SIZE }}
                    >
                      <StageSymbol
                        type={symbolType}
                        color={colors.border}
                        isOptional={node.isOptional}
                        size={SYMBOL_SIZE}
                      />
                      {isCurrent && showPrediction && (
                        <div
                          className="absolute inset-[-4px] rounded-full animate-pulse pointer-events-none border-2"
                          style={{ borderColor: colors.border }}
                        />
                      )}
                    </button>

                    {/* Labels below */}
                    <div className="mt-3 flex flex-col items-center text-center" style={{ width: 100 }}>
                      <div
                        className="text-xs font-semibold leading-tight truncate w-full"
                        style={{ color: colors.border }}
                      >
                        {node.shortName}
                      </div>
                      <div className="text-[10px] text-muted-foreground">{colors.label}</div>
                      <div className="text-[9px] text-muted-foreground mt-0.5">
                        {node.duration} {node.duration === 1 ? "dzień" : "dni"}
                      </div>
                      <div className="text-[8px] text-muted-foreground">
                        {formatDate(node.dateStart)} → {formatDate(node.dateEnd)}
                      </div>
                    </div>

                    {/* Alternative branches below decision points */}
                    {node.alternatives && node.alternatives.length > 0 && (
                      <div className="mt-6 flex flex-col items-center">
                        {/* Vertical dashed line down */}
                        <div className="w-0.5 h-8 border-l-2 border-dashed border-muted-foreground/40" />

                        {/* Alternative options */}
                        <div className="flex gap-4 mt-2">
                          {node.alternatives.map((alt, altIdx) => {
                            const altColors = INSTITUTION_COLORS[alt.institution] || INSTITUTION_COLORS.sejm
                            const altSymbolType = getSymbolType(alt.shape)

                            return (
                              <div
                                key={`alt-${altIdx}`}
                                className="flex flex-col items-center opacity-50"
                                style={{ filter: "grayscale(40%)" }}
                              >
                                {altIdx > 0 && (
                                  <div className="w-8 h-0.5 border-t-2 border-dashed border-muted-foreground/40 absolute" />
                                )}
                                <button
                                  onClick={() => setSelectedNode(alt)}
                                  className="transition-transform hover:scale-110"
                                  style={{ width: 40, height: 40 }}
                                >
                                  <StageSymbol
                                    type={altSymbolType}
                                    color={altColors.border}
                                    isOptional={true}
                                    size={40}
                                  />
                                </button>
                                <div
                                  className="mt-1 text-[9px] text-muted-foreground text-center"
                                  style={{ width: 60 }}
                                >
                                  {alt.shortName}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Connecting line with days label */}
                  {!isLast && (
                    <div
                      className="flex items-center self-start relative"
                      style={{
                        width: gapWidth,
                        marginTop: SYMBOL_SIZE / 2 - 1,
                        opacity: showPrediction && isFuture ? 0.5 : 1,
                      }}
                    >
                      {/* Line */}
                      <div
                        className="h-0.5 w-full"
                        style={{
                          backgroundColor: colors.border,
                          opacity: isFuture ? 0.5 : 0.8,
                        }}
                      />

                      {/* Days label on the line */}
                      {node.daysToNext > 0 && (
                        <div
                          className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-1.5 py-0.5 rounded-full border border-border shadow-sm"
                          style={{ top: 0 }}
                        >
                          <span className="text-[9px] text-muted-foreground font-medium whitespace-nowrap">
                            {node.daysToNext} {node.daysToNext === 1 ? "dzień" : "dni"}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Bottom date axis */}
          <div className="mt-8 pt-4 border-t-2 border-border">
            <div className="flex items-start">
              {processedTimeline.map((node, idx) => {
                const isLast = idx === processedTimeline.length - 1
                const gapWidth = getGapWidth(node.daysToNext)

                return (
                  <div key={`date-${node.id}`} className="flex items-start">
                    {/* Date dot */}
                    <div className="flex flex-col items-center" style={{ width: SYMBOL_SIZE }}>
                      <div
                        className="relative group cursor-pointer"
                        onMouseEnter={() => setHoveredDateIdx(idx)}
                        onMouseLeave={() => setHoveredDateIdx(null)}
                      >
                        <div className="w-3 h-3 rounded-full bg-muted-foreground/60 hover:bg-foreground hover:scale-125 transition-all -mt-[7px]" />

                        {/* Tooltip on hover */}
                        {hoveredDateIdx === idx && (
                          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-popover text-popover-foreground text-[10px] px-2 py-1 rounded shadow-lg border border-border whitespace-nowrap">
                            {formatFullDate(node.dateStart)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Spacer matching gap */}
                    {!isLast && <div style={{ width: gapWidth }} />}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Selected node details panel */}
      {selectedNode && (
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">{selectedNode.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{selectedNode.description}</p>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-muted-foreground hover:text-foreground transition-colors text-xl leading-none"
            >
              ×
            </button>
          </div>
          {selectedNode.legalBasis && (
            <div className="mt-4 p-3 bg-muted/30 rounded-md">
              <div className="text-xs font-medium text-muted-foreground mb-1">Podstawa prawna</div>
              <div className="text-sm text-foreground">{selectedNode.legalBasis}</div>
            </div>
          )}
          {selectedNode.possibleOutcomes && selectedNode.possibleOutcomes.length > 0 && (
            <div className="mt-4">
              <div className="text-xs font-medium text-muted-foreground mb-2">Możliwe rezultaty</div>
              <ul className="space-y-1">
                {selectedNode.possibleOutcomes.map((outcome, idx) => (
                  <li key={idx} className="text-sm text-foreground flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                    {outcome}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="bg-card rounded-lg border border-border p-4">
        <h4 className="text-sm font-semibold text-foreground mb-3">Legenda</h4>
        <div className="flex flex-wrap gap-6">
          <div className="flex flex-wrap gap-3">
            {Object.entries(INSTITUTION_COLORS).map(([key, val]) => (
              <div key={key} className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: val.border }} />
                <span className="text-xs text-muted-foreground">{val.label}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <StageSymbol type="start" color="#6b7280" size={20} />
              <span className="text-xs text-muted-foreground">Start/Koniec</span>
            </div>
            <div className="flex items-center gap-2">
              <StageSymbol type="reading" color="#6b7280" size={20} />
              <span className="text-xs text-muted-foreground">Czytanie</span>
            </div>
            <div className="flex items-center gap-2">
              <StageSymbol type="work" color="#6b7280" size={20} />
              <span className="text-xs text-muted-foreground">Prace komisji</span>
            </div>
            <div className="flex items-center gap-2">
              <StageSymbol type="decision" color="#6b7280" size={20} />
              <span className="text-xs text-muted-foreground">Głosowanie</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
