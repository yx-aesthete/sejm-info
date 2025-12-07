"use client"

import { useState, useMemo, useCallback, useRef, useEffect } from "react"
import Link from "next/link"
import {
  Bookmark,
  BookmarkCheck,
  Share2,
  ExternalLink,
  Bell,
  BellOff,
  ArrowLeft,
  FileText,
  TrendingUp,
  Wallet,
  Users,
  Building2,
  Scale,
  Menu,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { CanvasTimeline } from "@/components/canvas-timeline"
import { ParliamentHemicycle } from "@/components/parliament-hemicycle"
import { DrukSidebar } from "@/components/portal/druk-sidebar"
import {
  INSTITUTION_COLORS,
  INITIATOR_COLORS,
  type TimelineNode,
  type LegislativeProcess,
} from "@/lib/legislative-schema"
import type { ExtendedLegislativeProcess } from "@/lib/legislative-extended-schema"
import { SEJM_COMPOSITION, SENAT_COMPOSITION, estimateVoting, RULING_COALITION } from "@/lib/parliament-data"

const INITIATOR_LABELS: Record<string, string> = {
  president: "Projekt prezydencki",
  government: "Projekt rządowy",
  deputies: "Projekt poselski",
  senate: "Projekt senacki",
  citizens: "Projekt obywatelski",
}

const STAGE_DESCRIPTIONS: Record<string, string> = {
  circle:
    "Moment formalnego rozpoczęcia lub zakończenia procesu legislacyjnego. Inicjatywa ustawodawcza oznacza złożenie projektu ustawy w Sejmie.",
  rectangle:
    "Czytanie to etap debaty nad projektem ustawy na posiedzeniu plenarnym. Pierwsze czytanie może odbyć się na posiedzeniu Sejmu lub w komisji.",
  "rounded-rect":
    "Prace komisji sejmowej lub senackiej nad projektem. Komisje analizują projekt, zgłaszają poprawki i przygotowują sprawozdanie.",
  diamond:
    "Głosowanie to moment podjęcia decyzji przez izbę. Ustawa wymaga zwykłej większości głosów przy obecności co najmniej połowy posłów.",
  "double-circle":
    "Publikacja w Dzienniku Ustaw kończy proces legislacyjny. Ustawa wchodzi w życie 14 dni po publikacji, chyba że sama stanowi inaczej.",
  "circle-x": "Odrzucenie projektu kończy proces legislacyjny negatywnie. Może nastąpić na każdym etapie prac.",
}

interface DrukPageClientProps {
  process: ExtendedLegislativeProcess & { timeline: TimelineNode[] }
  drukNr: string
}

export function DrukPageClient({ process, drukNr }: DrukPageClientProps) {
  const [isWatched, setIsWatched] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null)
  const [hoveredStageId, setHoveredStageId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [leftPanelWidth, setLeftPanelWidth] = useState(30)
  const [timelineHeight, setTimelineHeight] = useState(40)
  const [isResizingH, setIsResizingH] = useState(false)
  const [isResizingV, setIsResizingV] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const timeline = process.timeline

  const { currentStage, selectedStage, pastVotings, hoveredStage, allStages } = useMemo(() => {
    if (!timeline || timeline.length === 0) {
      return {
        currentStage: null,
        selectedStage: null,
        pastVotings: [],
        hoveredStage: null,
        allStages: [],
      }
    }

    const currentIndex = timeline.findIndex((n) => n.status === "current")
    const current = currentIndex >= 0 ? timeline[currentIndex] : timeline[timeline.length - 1]
    const selected = selectedStageId ? timeline.find((n) => n.id === selectedStageId) || null : null
    const hovered = hoveredStageId ? timeline.find((n) => n.id === hoveredStageId) || null : null
    const votings = timeline.filter((n) => n.status === "completed" && n.shape === "diamond" && n.votingResult)

    return {
      currentStage: current,
      selectedStage: selected,
      pastVotings: votings,
      hoveredStage: hovered,
      allStages: timeline,
    }
  }, [timeline, selectedStageId, hoveredStageId])

  const displayStage = hoveredStage || selectedStage || currentStage

  const nextVoting = useMemo(() => {
    if (!timeline || timeline.length === 0) return null
    return timeline.find((n) => n.status !== "completed" && n.shape === "diamond")
  }, [timeline])

  const votingEstimation = useMemo(() => {
    if (!nextVoting) return null
    const composition = nextVoting.institution === "senat" ? SENAT_COMPOSITION : SEJM_COMPOSITION
    return estimateVoting(composition, RULING_COALITION)
  }, [nextVoting])

  const handleStageClick = useCallback((node: TimelineNode) => {
    setSelectedStageId((prev) => (prev === node.id ? null : node.id))
  }, [])

  const handleStageHover = useCallback((stageId: string | null) => {
    setHoveredStageId(stageId)
  }, [])

  const sejmVotings = pastVotings.filter((v) => v.institution === "sejm")
  const senatVotings = pastVotings.filter((v) => v.institution === "senat")

  const showSejmEstimation = nextVoting?.institution === "sejm"
  const showSenatEstimation = nextVoting?.institution === "senat"

  const initiatorColor = INITIATOR_COLORS[process.initiator] || "#6b7280"
  const initiatorLabel = INITIATOR_LABELS[process.initiator] || "Projekt ustawodawczy"

  const handleMouseMoveH = useCallback(
    (e: MouseEvent) => {
      if (!isResizingH || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const newWidth = ((e.clientX - rect.left) / rect.width) * 100
      setLeftPanelWidth(Math.max(20, Math.min(45, newWidth)))
    },
    [isResizingH],
  )

  const handleMouseMoveV = useCallback(
    (e: MouseEvent) => {
      if (!isResizingV || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const newHeight = ((rect.bottom - e.clientY) / rect.height) * 100
      setTimelineHeight(Math.max(25, Math.min(60, newHeight)))
    },
    [isResizingV],
  )

  const handleMouseUp = useCallback(() => {
    setIsResizingH(false)
    setIsResizingV(false)
  }, [])

  useEffect(() => {
    if (isResizingH) {
      window.addEventListener("mousemove", handleMouseMoveH)
      window.addEventListener("mouseup", handleMouseUp)
      return () => {
        window.removeEventListener("mousemove", handleMouseMoveH)
        window.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isResizingH, handleMouseMoveH, handleMouseUp])

  useEffect(() => {
    if (isResizingV) {
      window.addEventListener("mousemove", handleMouseMoveV)
      window.addEventListener("mouseup", handleMouseUp)
      return () => {
        window.removeEventListener("mousemove", handleMouseMoveV)
        window.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isResizingV, handleMouseMoveV, handleMouseUp])

  const processForTimeline: LegislativeProcess = useMemo(
    () => ({
      id: process.id,
      title: process.title,
      shortTitle: process.shortTitle,
      documentNumber: process.documentNumber,
      initiator: process.initiator,
      initiatorName: process.initiatorName,
      processStatus: process.processStatus,
      timeline: timeline,
      lastUpdated: process.lastUpdated,
      sourceUrl: process.sourceUrl,
    }),
    [process, timeline],
  )

  if (!timeline || timeline.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Brak danych o procesie</h1>
          <p className="text-muted-foreground mb-4">Druk nr {drukNr} nie ma jeszcze zdefiniowanej osi czasu.</p>
          <Link href="/">
            <Button>Powrót do galerii</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <DrukSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} currentDrukNr={drukNr} />

      <div ref={containerRef} className="h-screen flex flex-col bg-background overflow-hidden select-none">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0 bg-card">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-4 w-4" />
            </Button>
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Powrót
              </Button>
            </Link>
            <div className="h-4 w-px bg-border" />
            <span className="text-sm font-medium text-muted-foreground">Druk nr {drukNr}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={notificationsEnabled ? "default" : "outline"}
              size="sm"
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            >
              {notificationsEnabled ? <BellOff className="h-4 w-4 mr-2" /> : <Bell className="h-4 w-4 mr-2" />}
              {notificationsEnabled ? "Wyłącz" : "Powiadomienia"}
            </Button>
            <Button variant={isWatched ? "default" : "outline"} size="sm" onClick={() => setIsWatched(!isWatched)}>
              {isWatched ? <BookmarkCheck className="h-4 w-4 mr-2" /> : <Bookmark className="h-4 w-4 mr-2" />}
              {isWatched ? "Obserwujesz" : "Obserwuj"}
            </Button>
            <Button variant="outline" size="icon">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" asChild>
              <a
                href={`https://www.sejm.gov.pl/Sejm10.nsf/druk.xsp?nr=${drukNr}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>

        {/* Główna zawartość - górna część */}
        <div className="flex min-h-0 overflow-hidden p-3 gap-0" style={{ height: `${100 - timelineHeight}%` }}>
          {/* Lewa kolumna - postęp, głosowania, wszystkie etapy */}
          <div
            className="bg-card rounded-xl border border-border p-3 flex flex-col overflow-hidden shrink-0"
            style={{ width: `${leftPanelWidth}%` }}
          >
            {/* Postęp */}
            <div className="mb-3 pb-3 border-b border-border shrink-0">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: initiatorColor }} />
                <span className="text-xs font-medium">{initiatorLabel}</span>
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                <span>Postęp procesu</span>
                <span>
                  {allStages.filter((n) => n.status === "completed").length}/{allStages.length} etapów
                </span>
              </div>
              <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${(allStages.filter((n) => n.status === "completed").length / allStages.length) * 100}%`,
                    backgroundColor: initiatorColor,
                  }}
                />
              </div>
            </div>

            {/* Wizualizacje głosowań */}
            <div className="mb-3 pb-3 border-b border-border shrink-0">
              {(sejmVotings.length > 0 || showSejmEstimation) && (
                <div className="mb-3">
                  <h4 className="font-semibold text-xs mb-1 flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: INSTITUTION_COLORS.sejm.border }}
                    />
                    Sejm
                    {showSejmEstimation && sejmVotings.length === 0 && (
                      <span className="text-[10px] text-yellow-600 font-normal">(estymacja)</span>
                    )}
                  </h4>
                  <ParliamentHemicycle
                    composition={SEJM_COMPOSITION}
                    votingResult={sejmVotings[sejmVotings.length - 1]?.votingResult}
                    estimation={
                      showSejmEstimation && sejmVotings.length === 0 ? (votingEstimation ?? undefined) : undefined
                    }
                  />
                </div>
              )}

              {(senatVotings.length > 0 || showSenatEstimation) && (
                <div>
                  <h4 className="font-semibold text-xs mb-1 flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: INSTITUTION_COLORS.senat.border }}
                    />
                    Senat
                    {showSenatEstimation && senatVotings.length === 0 && (
                      <span className="text-[10px] text-yellow-600 font-normal">(estymacja)</span>
                    )}
                  </h4>
                  <ParliamentHemicycle
                    composition={SENAT_COMPOSITION}
                    votingResult={senatVotings[senatVotings.length - 1]?.votingResult}
                    estimation={
                      showSenatEstimation && senatVotings.length === 0 ? (votingEstimation ?? undefined) : undefined
                    }
                  />
                </div>
              )}

              {sejmVotings.length === 0 && senatVotings.length === 0 && !showSejmEstimation && !showSenatEstimation && (
                <div className="flex items-center justify-center h-16 text-muted-foreground text-xs">Brak głosowań</div>
              )}
            </div>

            {/* Lista etapów */}
            <div className="flex-1 overflow-auto min-h-0">
              <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wide mb-2 sticky top-0 bg-card py-1">
                Etapy procesu ({allStages.length})
              </h4>
              <div className="space-y-1">
                {allStages.map((stage) => {
                  const isCurrent = stage.status === "current"
                  const isSelected = selectedStageId === stage.id
                  const isHovered = hoveredStageId === stage.id
                  const isCompleted = stage.status === "completed"
                  const institutionColor = INSTITUTION_COLORS[stage.institution]?.border || "#6b7280"

                  return (
                    <div
                      key={stage.id}
                      className={`p-2 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-blue-500/10 border-blue-500 border-2"
                          : isCurrent
                            ? "bg-yellow-500/10 border-yellow-500 border-2"
                            : isHovered
                              ? "bg-muted border-muted-foreground/50"
                              : isCompleted
                                ? "bg-muted/30 border-muted"
                                : "border-dashed border-muted-foreground/30"
                      }`}
                      onMouseEnter={() => handleStageHover(stage.id)}
                      onMouseLeave={() => handleStageHover(null)}
                      onClick={() => handleStageClick(stage)}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: institutionColor }} />
                        <span
                          className={`text-xs font-medium truncate ${!isCompleted && !isCurrent ? "text-muted-foreground" : ""}`}
                        >
                          {stage.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                        <span>{INSTITUTION_COLORS[stage.institution]?.label}</span>
                        {isCurrent && <span className="text-yellow-600 font-medium">• OBECNY</span>}
                        {isSelected && !isCurrent && <span className="text-blue-600 font-medium">• WYBRANY</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Resize handle horizontal */}
          <div
            className="w-2 cursor-col-resize hover:bg-primary/20 active:bg-primary/40 transition-colors mx-1 rounded flex items-center justify-center"
            onMouseDown={() => setIsResizingH(true)}
          >
            <div className="w-0.5 h-8 bg-border rounded" />
          </div>

          {/* Prawa kolumna - opis */}
          <div className="flex-1 bg-card rounded-xl border border-border p-4 flex flex-col overflow-hidden min-w-0">
            {/* Tytuł */}
            <div className="mb-3 pb-3 border-b border-border shrink-0">
              <h2 className="font-bold text-lg leading-tight">{process.title}</h2>
              <p className="text-xs text-muted-foreground mt-1">{process.documentNumber}</p>
            </div>

            {/* Aktualnie wybrany/hover etap */}
            {displayStage && (
              <div className="mb-3 pb-3 border-b border-border shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: INSTITUTION_COLORS[displayStage.institution]?.border }}
                  />
                  <h3 className="font-semibold text-sm">{displayStage.name}</h3>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    {INSTITUTION_COLORS[displayStage.institution]?.label}
                  </span>
                  {displayStage.status === "current" && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-700">OBECNY</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {displayStage.description || STAGE_DESCRIPTIONS[displayStage.shape] || "Brak opisu dla tego etapu."}
                </p>
                {displayStage.legalBasis && (
                  <p className="text-xs text-muted-foreground mt-2 italic">
                    Podstawa prawna: {displayStage.legalBasis}
                  </p>
                )}
                {displayStage.dateStart && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Data: {new Date(displayStage.dateStart).toLocaleDateString("pl-PL")}
                    {displayStage.dateStart !== displayStage.dateEnd &&
                      displayStage.dateEnd &&
                      ` → ${new Date(displayStage.dateEnd).toLocaleDateString("pl-PL")}`}
                  </p>
                )}
                {displayStage.votingResult && (
                  <div className="mt-2 flex gap-3 text-xs">
                    <span className="text-green-600 font-medium">Za: {displayStage.votingResult.for}</span>
                    <span className="text-red-600 font-medium">Przeciw: {displayStage.votingResult.against}</span>
                    <span className="text-gray-500">Wstrzymało się: {displayStage.votingResult.abstained}</span>
                  </div>
                )}
              </div>
            )}

            {/* W prostych słowach + Impact */}
            <div className="flex-1 overflow-auto text-sm text-muted-foreground leading-relaxed space-y-4">
              {process.simpleExplanation && (
                <div>
                  <h4 className="font-semibold text-foreground flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4" />W prostych słowach
                  </h4>
                  <p>{process.simpleExplanation}</p>
                  {process.keyChanges && process.keyChanges.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {process.keyChanges.map((change, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                          {change}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {process.impact && (
                <div>
                  <h4 className="font-semibold text-foreground flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4" />
                    Analiza wpływu
                  </h4>
                  <div className="space-y-2">
                    {process.impact.financial && (
                      <div className="flex items-start gap-2 p-2 rounded bg-amber-500/10 text-amber-700">
                        <Wallet className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium">Skutki finansowe: </span>
                          {process.impact.financial.description}
                          {process.impact.financial.budgetImpact && (
                            <span className="block text-xs mt-0.5">
                              Wpływ na budżet: {process.impact.financial.budgetImpact > 0 ? "+" : ""}
                              {process.impact.financial.budgetImpact} mln PLN
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    {process.impact.social && (
                      <div className="flex items-start gap-2 p-2 rounded bg-blue-500/10 text-blue-700">
                        <Users className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium">Grupy dotknięte: </span>
                          {process.impact.social.affectedGroups?.join(", ")}
                        </div>
                      </div>
                    )}
                    {process.impact.economic && (
                      <div className="flex items-start gap-2 p-2 rounded bg-green-500/10 text-green-700">
                        <Building2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium">Sektory: </span>
                          {process.impact.economic.sectors?.join(", ")}
                        </div>
                      </div>
                    )}
                    {process.impact.legal && (
                      <div className="flex items-start gap-2 p-2 rounded bg-purple-500/10 text-purple-700">
                        <Scale className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium">Zmiany prawne: </span>
                          {process.impact.legal.amendedActs?.join(", ")}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Resize handle vertical */}
        <div
          className="h-2 cursor-row-resize hover:bg-primary/20 active:bg-primary/40 transition-colors mx-3 rounded flex justify-center items-center"
          onMouseDown={() => setIsResizingV(true)}
        >
          <div className="h-0.5 w-16 bg-border rounded" />
        </div>

        {/* Timeline na dole */}
        <div
          className="mx-3 mb-3 bg-card rounded-xl border border-border overflow-hidden"
          style={{ height: `${timelineHeight}%` }}
        >
          <CanvasTimeline
            process={processForTimeline}
            onStageClick={handleStageClick}
            selectedStageId={selectedStageId}
            hoveredStageId={hoveredStageId}
            onStageHover={handleStageHover}
            showProcessSelector={false}
            autoScale={true}
            showNowLine={true}
            showAlternatives={true}
            showControls={true}
            minHeight={150}
          />
        </div>
      </div>
    </>
  )
}
