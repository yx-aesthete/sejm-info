"use client"

import { INSTITUTION_COLORS, type TimelineNode, formatDate, daysBetween } from "@/lib/legislative-schema"
import { StageSymbol } from "./stage-symbol"

interface StageCardProps {
  node: TimelineNode
  type: "previous" | "current" | "next" | "selected"
  onClick?: () => void
}

export function StageCard({ node, type, onClick }: StageCardProps) {
  const colors = INSTITUTION_COLORS[node.institution]
  const duration = daysBetween(node.dateStart, node.dateEnd)

  const typeStyles = {
    previous: "bg-muted/50 border-muted",
    current: "bg-card border-primary ring-2 ring-primary/20",
    next: "bg-card/50 border-dashed border-muted-foreground/30",
    selected: "bg-card border-accent ring-2 ring-accent/20",
  }

  const typeLabels = {
    previous: "Poprzedni etap",
    current: "Obecny etap",
    next: "Następny etap",
    selected: "Wybrany etap",
  }

  return (
    <div
      onClick={onClick}
      className={`rounded-xl border p-4 transition-all ${typeStyles[type]} ${onClick ? "cursor-pointer hover:shadow-md" : ""}`}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <StageSymbol
            shape={
              node.shape === "circle" && node.status === "alternative"
                ? "circle-x"
                : node.shape === "circle" && node.institution === "publikacja"
                  ? "double-circle"
                  : node.shape
            }
            color={colors.border}
            size={48}
            isOptional={node.isOptional}
            isFuture={node.status === "future"}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ backgroundColor: colors.bg + "20", color: colors.border }}
            >
              {typeLabels[type]}
            </span>
            <span className="text-xs text-muted-foreground">{colors.label}</span>
          </div>
          <h4 className="font-semibold text-foreground truncate">{node.name}</h4>
          {node.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{node.description}</p>}
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span>
              {duration} {duration === 1 ? "dzień" : "dni"}
            </span>
            <span>•</span>
            <span>
              {formatDate(node.dateStart)} → {formatDate(node.dateEnd)}
            </span>
          </div>
          {node.votingResult && (
            <div className="flex gap-3 mt-2 text-xs">
              <span className="text-green-600">Za: {node.votingResult.for}</span>
              <span className="text-red-600">Przeciw: {node.votingResult.against}</span>
              <span className="text-gray-500">Wstrzym.: {node.votingResult.abstained}</span>
            </div>
          )}
          {node.legalBasis && <div className="mt-2 text-xs text-muted-foreground italic">{node.legalBasis}</div>}
        </div>
      </div>
    </div>
  )
}
