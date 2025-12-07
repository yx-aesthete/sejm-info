"use client"

import { useState } from "react"
import {
  X,
  Bookmark,
  BookmarkCheck,
  Share2,
  ExternalLink,
  Clock,
  Users,
  TrendingUp,
  FileText,
  ChevronDown,
  ChevronUp,
  Scale,
  Wallet,
  Building2,
  BarChart3,
  Layers,
  AlertCircle,
  Calendar,
  FileCheck,
  Leaf,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  type ExtendedLegislativeProcess,
  CATEGORY_CONFIG,
  URGENCY_CONFIG,
  getProcessProgress,
  getCurrentStage,
  getNextStage,
} from "@/lib/legislative-extended-schema"
import { INSTITUTION_COLORS, INITIATOR_COLORS } from "@/lib/legislative-schema"
import { CanvasTimeline } from "@/components/canvas-timeline"

interface LawDetailProps {
  process: ExtendedLegislativeProcess
  isWatched?: boolean
  onWatch?: (id: string) => void
  onClose?: () => void
}

export function LawDetail({ process, isWatched = false, onWatch, onClose }: LawDetailProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(["summary", "analytics", "timeline"])
  const progress = getProcessProgress(process)
  const currentStage = getCurrentStage(process)
  const nextStage = getNextStage(process)

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => (prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]))
  }

  const initiatorColor = INITIATOR_COLORS[process.initiator]

  const INITIATOR_LABELS: Record<string, string> = {
    president: "Prezydent RP",
    government: "Rada Ministrów",
    deputies: "Grupa posłów",
    senate: "Senat",
    citizens: "Inicjatywa obywatelska",
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border bg-card p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="outline" className="font-mono">
                {process.documentNumber}
              </Badge>
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: initiatorColor }}
                title={INITIATOR_LABELS[process.initiator]}
              />
              {process.urgency !== "normal" && (
                <Badge variant="destructive" style={{ backgroundColor: URGENCY_CONFIG[process.urgency].color }}>
                  {URGENCY_CONFIG[process.urgency].label}
                </Badge>
              )}
            </div>
            <h2 className="text-xl font-bold leading-tight mb-1">{process.shortTitle}</h2>
            <p className="text-sm text-muted-foreground">{process.initiatorName}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="outline" size="icon" onClick={() => onWatch?.(process.id)}>
              {isWatched ? <BookmarkCheck className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="icon">
              <Share2 className="h-4 w-4" />
            </Button>
            {process.sourceUrl && (
              <Button variant="outline" size="icon" asChild>
                <a href={process.sourceUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted-foreground">Postęp procesu</span>
            <span className="font-semibold">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex items-center justify-between mt-2 text-sm">
            {currentStage && (
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: INSTITUTION_COLORS[currentStage.institution].bg }}
                />
                <span>
                  Teraz: <strong>{currentStage.name}</strong>
                </span>
              </div>
            )}
            {nextStage && <span className="text-muted-foreground">Następny: {nextStage.shortName}</span>}
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Prosty język */}
          <Card>
            <CardHeader className="cursor-pointer py-3" onClick={() => toggleSection("summary")}>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />W prostych słowach
                </CardTitle>
                {expandedSections.includes("summary") ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </CardHeader>
            {expandedSections.includes("summary") && (
              <CardContent className="pt-0">
                <p className="text-muted-foreground mb-4">{process.simpleExplanation}</p>
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Kluczowe zmiany:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {process.keyChanges.map((change, i) => (
                      <li key={i}>{change}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Parametry analityczne */}
          <Card>
            <CardHeader className="cursor-pointer py-3" onClick={() => toggleSection("analytics")}>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Parametry analityczne
                </CardTitle>
                {expandedSections.includes("analytics") ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </CardHeader>
            {expandedSections.includes("analytics") && (
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-3">
                  {/* Liczba etapów */}
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 border border-border">
                    <Layers className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Etapy procesu</p>
                      <p className="text-lg font-bold">{process.timeline.length}</p>
                    </div>
                  </div>

                  {/* Kategorie */}
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 border border-border">
                    <FileCheck className="h-4 w-4 text-purple-500 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Kategorie</p>
                      <p className="text-lg font-bold">{process.categories.length}</p>
                    </div>
                  </div>

                  {/* Powiązane ustawy */}
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 border border-border">
                    <Scale className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Powiązane ustawy</p>
                      <p className="text-lg font-bold">{process.relatedLaws.length}</p>
                    </div>
                  </div>

                  {/* Kluczowe zmiany */}
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 border border-border">
                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Kluczowe zmiany</p>
                      <p className="text-lg font-bold">{process.keyChanges.length}</p>
                    </div>
                  </div>

                  {/* Ostatnia aktualizacja */}
                  <div className="col-span-2 flex items-start gap-2 p-3 rounded-lg bg-muted/30 border border-border">
                    <Calendar className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">Ostatnia aktualizacja</p>
                      <p className="text-sm font-medium">
                        {new Date(process.lastUpdated).toLocaleDateString("pl-PL", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Wpływ środowiskowy (jeśli jest) */}
                  {process.impact?.environmental && (
                    <div className="col-span-2 flex items-start gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                      <Leaf className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">Wpływ środowiskowy</p>
                        {process.impact.environmental.co2Impact && (
                          <p className="text-sm font-bold text-green-600">
                            {process.impact.environmental.co2Impact > 0 ? "+" : ""}
                            {process.impact.environmental.co2Impact.toLocaleString()} ton CO₂
                          </p>
                        )}
                        {process.impact.environmental.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {process.impact.environmental.description}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Oś czasu */}
          <Card>
            <CardHeader className="cursor-pointer py-3" onClick={() => toggleSection("timeline")}>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Przebieg procesu
                </CardTitle>
                {expandedSections.includes("timeline") ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </CardHeader>
            {expandedSections.includes("timeline") && (
              <CardContent className="pt-0">
                <div className="h-[300px] overflow-auto">
                  <CanvasTimeline process={process} showAlternatives={true} showNowLine={true} autoScale={true} />
                </div>
              </CardContent>
            )}
          </Card>

          {/* Impact analysis */}
          {process.impact && (
            <Card>
              <CardHeader className="cursor-pointer py-3" onClick={() => toggleSection("impact")}>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Analiza wpływu
                  </CardTitle>
                  {expandedSections.includes("impact") ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </CardHeader>
              {expandedSections.includes("impact") && (
                <CardContent className="pt-0 space-y-4">
                  {process.impact.financial && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <Wallet className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-sm">Wpływ finansowy</h4>
                        <p className="text-2xl font-bold text-amber-600">
                          {process.impact.financial.budgetImpact > 0 ? "+" : ""}
                          {process.impact.financial.budgetImpact.toLocaleString()} mln PLN
                        </p>
                        <p className="text-sm text-muted-foreground">{process.impact.financial.description}</p>
                      </div>
                    </div>
                  )}

                  {process.impact.social && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <Users className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-sm mb-2">Wpływ społeczny</h4>
                        <div className="text-sm space-y-1">
                          <p>
                            <span className="text-muted-foreground">Dotknięte grupy:</span>{" "}
                            {process.impact.social.affectedGroups.join(", ")}
                          </p>
                          {process.impact.social.positiveEffects.length > 0 && (
                            <p className="text-green-600">+ {process.impact.social.positiveEffects.join(", ")}</p>
                          )}
                          {process.impact.social.negativeEffects.length > 0 && (
                            <p className="text-red-600">- {process.impact.social.negativeEffects.join(", ")}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {process.impact.economic && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <Building2 className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-sm mb-2">Wpływ ekonomiczny</h4>
                        <div className="text-sm space-y-1">
                          <p>
                            <span className="text-muted-foreground">Sektory:</span>{" "}
                            {process.impact.economic.sectors.join(", ")}
                          </p>
                          {process.impact.economic.employmentImpact && (
                            <p>
                              Wpływ na zatrudnienie:{" "}
                              <strong>{process.impact.economic.employmentImpact.toLocaleString()}</strong> miejsc pracy
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          )}

          {/* Powiązane ustawy */}
          {process.relatedLaws.length > 0 && (
            <Card>
              <CardHeader className="cursor-pointer py-3" onClick={() => toggleSection("related")}>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Scale className="h-4 w-4 text-primary" />
                    Powiązane akty prawne
                  </CardTitle>
                  {expandedSections.includes("related") ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </CardHeader>
              {expandedSections.includes("related") && (
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {process.relatedLaws.map((law) => (
                      <div
                        key={law.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer"
                      >
                        <div>
                          <p className="font-medium text-sm">{law.title}</p>
                          {law.dziennikUstaw && <p className="text-xs text-muted-foreground">{law.dziennikUstaw}</p>}
                        </div>
                        <Badge variant="outline" className="text-xs capitalize">
                          {law.relation}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {/* Kategorie i tagi */}
          <Card>
            <CardContent className="py-4">
              <div className="flex flex-wrap gap-2">
                {process.categories.map((cat) => (
                  <Badge
                    key={cat}
                    variant="secondary"
                    style={{
                      backgroundColor: `${CATEGORY_CONFIG[cat].color}20`,
                      color: CATEGORY_CONFIG[cat].color,
                    }}
                  >
                    {CATEGORY_CONFIG[cat].icon} {CATEGORY_CONFIG[cat].label}
                  </Badge>
                ))}
                {process.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  )
}
