"use client"

import type React from "react"

import { useEffect, useRef, useState, useCallback } from "react"
import {
  type LegislativeProcess,
  EXAMPLE_PROCESSES,
  INSTITUTION_COLORS,
  type TimelineNode,
} from "@/lib/legislative-schema"
import {
  layoutNodesSequential,
  layoutNodesProportional,
  renderDiagram,
  DEFAULT_GRID,
  type GridConfig,
  type DiagramNode,
} from "@/lib/diagram-framework"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

type LayoutMode = "sequential" | "proportional"

interface CanvasTimelineProps {
  process?: LegislativeProcess
  onStageClick?: (node: TimelineNode) => void
  selectedStageId?: string | null
  hoveredStageId?: string | null
  onStageHover?: (stageId: string | null) => void
  showProcessSelector?: boolean
  autoScale?: boolean
  showNowLine?: boolean
  showAlternatives?: boolean
  showControls?: boolean
  minHeight?: number
}

export function CanvasTimeline({
  process: externalProcess,
  onStageClick,
  selectedStageId,
  hoveredStageId,
  onStageHover,
  showProcessSelector = true,
  autoScale = false,
  showNowLine: externalShowNowLine,
  showAlternatives: externalShowAlternatives,
  showControls = true,
  minHeight = 200,
}: CanvasTimelineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [internalProcess, setInternalProcess] = useState<LegislativeProcess>(EXAMPLE_PROCESSES[0])
  const selectedProcess = externalProcess || internalProcess

  const [manualScale, setManualScale] = useState(1)
  const [computedScale, setComputedScale] = useState(1)
  const [internalShowNowLine, setInternalShowNowLine] = useState(true)
  const [internalShowAlternatives, setInternalShowAlternatives] = useState(false)
  const [internalHoveredNode, setInternalHoveredNode] = useState<DiagramNode | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

  const showNowLine = externalShowNowLine !== undefined ? externalShowNowLine : internalShowNowLine
  const showAlternatives = externalShowAlternatives !== undefined ? externalShowAlternatives : internalShowAlternatives

  const [layoutMode, setLayoutMode] = useState<LayoutMode>("sequential")
  const [pixelsPerDay, setPixelsPerDay] = useState(12)

  const [layout, setLayout] = useState<{
    nodes: DiagramNode[]
    connectors: ReturnType<typeof layoutNodesSequential>["connectors"]
    totalWidth: number
    totalHeight: number
  } | null>(null)

  useEffect(() => {
    if (!autoScale || !containerRef.current) return

    const updateScale = () => {
      if (!containerRef.current) return
      const containerWidth = containerRef.current.clientWidth * 0.9

      const baseConfig = { ...DEFAULT_GRID }
      const baseLayout =
        layoutMode === "sequential"
          ? layoutNodesSequential(selectedProcess.timeline, baseConfig, showAlternatives)
          : layoutNodesProportional(selectedProcess.timeline, baseConfig, pixelsPerDay, 120, showAlternatives)

      if (baseLayout.totalWidth > 0) {
        const newScale = Math.min(1.5, Math.max(0.4, containerWidth / baseLayout.totalWidth))
        setComputedScale(newScale)
      }
    }

    updateScale()
    window.addEventListener("resize", updateScale)
    return () => window.removeEventListener("resize", updateScale)
  }, [autoScale, selectedProcess, layoutMode, pixelsPerDay, showAlternatives])

  const scale = autoScale ? computedScale : manualScale

  const getConfig = useCallback(
    (): GridConfig => ({
      ...DEFAULT_GRID,
      cellSize: DEFAULT_GRID.cellSize * scale,
      symbolSize: DEFAULT_GRID.symbolSize * scale,
      padding: DEFAULT_GRID.padding * scale,
      rowHeight: DEFAULT_GRID.rowHeight * scale,
      labelOffset: DEFAULT_GRID.labelOffset * scale,
    }),
    [scale],
  )

  const currentNode = selectedProcess.timeline.find((n) => n.status === "current")

  useEffect(() => {
    const config = getConfig()

    const result =
      layoutMode === "sequential"
        ? layoutNodesSequential(selectedProcess.timeline, config, showAlternatives)
        : layoutNodesProportional(selectedProcess.timeline, config, pixelsPerDay * scale, 120 * scale, showAlternatives)

    setLayout(result)
  }, [selectedProcess, scale, getConfig, layoutMode, pixelsPerDay, showAlternatives])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !layout) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const config = getConfig()

    const dpr = window.devicePixelRatio || 1
    canvas.width = layout.totalWidth * dpr
    canvas.height = layout.totalHeight * dpr
    canvas.style.width = `${layout.totalWidth}px`
    canvas.style.height = `${layout.totalHeight}px`
    ctx.scale(dpr, dpr)

    renderDiagram(
      ctx,
      layout.nodes,
      layout.connectors,
      config,
      currentNode?.id,
      showNowLine,
      showAlternatives,
      selectedStageId,
      hoveredStageId,
    )
  }, [layout, showNowLine, showAlternatives, currentNode, getConfig, selectedStageId, hoveredStageId])

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!layout || !canvasRef.current || !onStageClick) return

      const rect = canvasRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const found = layout.nodes.find((node) => {
        const dx = Math.abs(x - node.centerX)
        const dy = Math.abs(y - node.centerY)
        return dx < node.width / 2 + 10 && dy < node.height / 2 + 10
      })

      if (found) {
        const originalNode = selectedProcess.timeline.find((n) => n.id === found.id)
        if (originalNode) {
          onStageClick(originalNode)
        }
      }
    },
    [layout, onStageClick, selectedProcess],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!layout || !canvasRef.current) return

      const rect = canvasRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const found = layout.nodes.find((node) => {
        const dx = Math.abs(x - node.centerX)
        const dy = Math.abs(y - node.centerY)
        return dx < node.width / 2 + 10 && dy < node.height / 2 + 10
      })

      if (found) {
        setInternalHoveredNode(found)
        setTooltipPos({ x: e.clientX, y: e.clientY })
        onStageHover?.(found.id)
      } else {
        setInternalHoveredNode(null)
        onStageHover?.(null)
      }
    },
    [layout, onStageHover],
  )

  const handleMouseLeave = useCallback(() => {
    setInternalHoveredNode(null)
    onStageHover?.(null)
  }, [onStageHover])

  return (
    <div className="flex flex-col h-full">
      {/* Kontrolki - tylko jeśli showControls */}
      {showControls && (
        <div className="flex flex-wrap items-center gap-4 p-2 bg-muted/30 rounded-t-lg shrink-0">
          {showProcessSelector && !externalProcess && (
            <div className="flex items-center gap-2">
              <Label className="text-xs font-medium">Proces:</Label>
              <Select
                value={internalProcess.id}
                onValueChange={(id) => {
                  const process = EXAMPLE_PROCESSES.find((p) => p.id === id)
                  if (process) setInternalProcess(process)
                }}
              >
                <SelectTrigger className="w-[180px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXAMPLE_PROCESSES.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.shortTitle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Tabs value={layoutMode} onValueChange={(v) => setLayoutMode(v as LayoutMode)}>
            <TabsList className="h-7">
              <TabsTrigger value="sequential" className="text-xs px-2 h-6">
                Sekwencyjny
              </TabsTrigger>
              <TabsTrigger value="proportional" className="text-xs px-2 h-6">
                Proporcjonalny
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {!autoScale && (
            <div className="flex items-center gap-2">
              <Label className="text-xs">Skala:</Label>
              <Slider
                value={[manualScale]}
                onValueChange={([v]) => setManualScale(v)}
                min={0.6}
                max={1.5}
                step={0.1}
                className="w-16"
              />
              <span className="text-xs text-muted-foreground w-8">{Math.round(manualScale * 100)}%</span>
            </div>
          )}

          {autoScale && <span className="text-xs text-muted-foreground">Skala: {Math.round(scale * 100)}%</span>}

          {layoutMode === "proportional" && (
            <div className="flex items-center gap-2">
              <Label className="text-xs">px/dzień:</Label>
              <Slider
                value={[pixelsPerDay]}
                onValueChange={([v]) => setPixelsPerDay(v)}
                min={4}
                max={24}
                step={2}
                className="w-16"
              />
              <span className="text-xs text-muted-foreground w-8">{pixelsPerDay}px</span>
            </div>
          )}

          {externalShowNowLine === undefined && (
            <div className="flex items-center gap-1.5">
              <Switch
                id="nowLine"
                checked={internalShowNowLine}
                onCheckedChange={setInternalShowNowLine}
                className="scale-75"
              />
              <Label htmlFor="nowLine" className="text-xs">
                TERAZ
              </Label>
            </div>
          )}

          {externalShowAlternatives === undefined && (
            <div className="flex items-center gap-1.5">
              <Switch
                id="alternatives"
                checked={internalShowAlternatives}
                onCheckedChange={setInternalShowAlternatives}
                className="scale-75"
              />
              <Label htmlFor="alternatives" className="text-xs">
                Alternatywy
              </Label>
            </div>
          )}
        </div>
      )}

      {/* Canvas */}
      <div
        ref={containerRef}
        className="relative flex-1 overflow-auto border rounded-lg bg-white dark:bg-card"
        style={{ minHeight }}
      >
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleCanvasClick}
          className="cursor-pointer"
        />

        {/* Tooltip */}
        {internalHoveredNode && (
          <div
            className="fixed z-50 bg-card border rounded-lg shadow-lg p-3 max-w-xs pointer-events-none"
            style={{
              left: tooltipPos.x + 15,
              top: tooltipPos.y + 15,
            }}
          >
            <div
              className="font-semibold text-sm"
              style={{ color: INSTITUTION_COLORS[internalHoveredNode.institution].border }}
            >
              {internalHoveredNode.name}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {INSTITUTION_COLORS[internalHoveredNode.institution].label}
            </div>
            {internalHoveredNode.description && (
              <div className="text-xs mt-2 text-foreground/80">{internalHoveredNode.description}</div>
            )}
            {internalHoveredNode.votingResult && (
              <div className="text-xs mt-2 font-mono bg-muted/50 p-1 rounded">
                Za: {internalHoveredNode.votingResult.for} | Przeciw: {internalHoveredNode.votingResult.against} |
                Wstrz.: {internalHoveredNode.votingResult.abstained}
              </div>
            )}
            {internalHoveredNode.legalBasis && (
              <div className="text-xs mt-1 text-muted-foreground italic">{internalHoveredNode.legalBasis}</div>
            )}
            <div className="text-xs mt-2 text-muted-foreground">
              {new Date(internalHoveredNode.dateStart).toLocaleDateString("pl-PL", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
              {internalHoveredNode.dateStart !== internalHoveredNode.dateEnd && (
                <>
                  {" → "}
                  {new Date(internalHoveredNode.dateEnd).toLocaleDateString("pl-PL", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
