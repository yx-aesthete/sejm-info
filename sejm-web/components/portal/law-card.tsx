"use client"
import Link from "next/link"
import { Bookmark, BookmarkCheck, Users, Eye, MessageSquare, TrendingUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  type ExtendedLegislativeProcess,
  CATEGORY_CONFIG,
  URGENCY_CONFIG,
  getProcessProgress,
  getCurrentStage,
} from "@/lib/legislative-extended-schema"
import { INSTITUTION_COLORS, INITIATOR_COLORS } from "@/lib/legislative-schema"

interface LawCardProps {
  process: ExtendedLegislativeProcess
  isWatched?: boolean
  onWatch?: (id: string) => void
  compact?: boolean
}

function getDrukNumber(process: ExtendedLegislativeProcess): string {
  const match = process.documentNumber.match(/(\d+)/)
  return match ? match[1] : process.id
}

export function LawCard({ process, isWatched = false, onWatch, compact = false }: LawCardProps) {
  const progress = getProcessProgress(process)
  const currentStage = getCurrentStage(process)
  const initiatorColor = INITIATOR_COLORS[process.initiator]
  const drukUrl = `/druk/${getDrukNumber(process)}`

  const statusColors = {
    "in-progress": "bg-blue-500",
    completed: "bg-green-500",
    rejected: "bg-red-500",
  }

  const statusLabels = {
    "in-progress": "W trakcie",
    completed: "Zakończony",
    rejected: "Odrzucony",
  }

  if (compact) {
    return (
      <Link href={drukUrl}>
        <Card className="group cursor-pointer transition-all hover:shadow-md hover:border-primary/50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">
                    {process.documentNumber}
                  </Badge>
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: initiatorColor }} />
                </div>
                <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                  {process.shortTitle}
                </h3>
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <span>{currentStage?.shortName || "Zakończony"}</span>
                  <span>•</span>
                  <span>{progress}%</span>
                </div>
              </div>
              <Button
                variant={isWatched ? "default" : "outline"}
                size="icon"
                className={`h-8 w-8 flex-shrink-0 ${isWatched ? "bg-primary text-primary-foreground" : "border-2 border-primary/50 hover:bg-primary/10"}`}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onWatch?.(process.id)
                }}
              >
                {isWatched ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
              </Button>
            </div>
            <Progress value={progress} className="h-1 mt-3" />
          </CardContent>
        </Card>
      </Link>
    )
  }

  return (
    <Link href={drukUrl}>
      <Card className="group cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 h-full">
        <CardContent className="p-5 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge variant="outline" className="font-mono text-xs">
                  {process.documentNumber}
                </Badge>
                <Badge
                  className="text-xs"
                  style={{
                    backgroundColor: statusColors[process.processStatus],
                    color: "white",
                  }}
                >
                  {statusLabels[process.processStatus]}
                </Badge>
                {process.urgency !== "normal" && (
                  <Badge
                    variant="destructive"
                    className="text-xs"
                    style={{ backgroundColor: URGENCY_CONFIG[process.urgency].color }}
                  >
                    {URGENCY_CONFIG[process.urgency].label}
                  </Badge>
                )}
              </div>
              <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2">
                {process.shortTitle}
              </h3>
            </div>
            <Button
              variant={isWatched ? "default" : "outline"}
              size="icon"
              className={`flex-shrink-0 ${isWatched ? "bg-primary text-primary-foreground shadow-md" : "border-2 border-primary hover:bg-primary/10"}`}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onWatch?.(process.id)
              }}
            >
              {isWatched ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
            </Button>
          </div>

          {/* Simple summary */}
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{process.simpleSummary}</p>

          {/* Categories - use icon components instead of emoji */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {process.categories?.slice(0, 3).map((cat) => {
              const config = CATEGORY_CONFIG[cat]
              if (!config) return null
              const IconComponent = config.icon
              return (
                <Badge
                  key={cat}
                  variant="secondary"
                  className="text-xs flex items-center gap-1"
                  style={{
                    backgroundColor: `${config.color}20`,
                    color: config.color,
                    borderColor: config.color,
                  }}
                >
                  <IconComponent className="h-3 w-3" />
                  {config.label}
                </Badge>
              )
            })}
          </div>

          {/* Progress */}
          <div className="mt-auto">
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-muted-foreground">Postęp</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              {currentStage && (
                <div className="flex items-center gap-2 mt-2 text-sm">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: INSTITUTION_COLORS[currentStage.institution].bg }}
                  />
                  <span className="text-muted-foreground">Obecny etap:</span>
                  <span className="font-medium">{currentStage.name}</span>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" />
                      {process.viewCount.toLocaleString()}
                    </TooltipTrigger>
                    <TooltipContent>Wyświetlenia</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {process.watchCount}
                    </TooltipTrigger>
                    <TooltipContent>Obserwujących</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5" />
                      {process.commentCount}
                    </TooltipTrigger>
                    <TooltipContent>Komentarzy</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {process.completionProbability && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="flex items-center gap-1 text-xs">
                      <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                      <span className="font-medium">{process.completionProbability}%</span>
                    </TooltipTrigger>
                    <TooltipContent>Prawdopodobieństwo uchwalenia</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
