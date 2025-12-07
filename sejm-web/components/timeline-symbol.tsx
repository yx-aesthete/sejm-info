"use client"

import { type TimelineNode, INSTITUTION_COLORS, daysBetween } from "@/lib/legislative-schema"
import { StageSymbol } from "./stage-symbol"

interface TimelineSymbolProps {
  node: TimelineNode
  scale: number
  isSelected?: boolean
  onClick?: () => void
  minWidth?: number
}

function mapShapeToStageType(
  shape: TimelineNode["shape"],
): "start" | "reading" | "work" | "decision" | "end-positive" | "end-negative" | "tribunal" {
  switch (shape) {
    case "circle":
      return "start"
    case "double-circle":
      return "end-positive"
    case "circle-x":
      return "end-negative"
    case "rectangle":
      return "reading"
    case "rounded-rect":
      return "work"
    case "diamond":
      return "decision"
    default:
      return "work"
  }
}

export function TimelineSymbol({ node, scale, isSelected, onClick, minWidth = 40 }: TimelineSymbolProps) {
  const colors = INSTITUTION_COLORS[node.institution]
  const isOptional = node.isOptional

  // Oblicz szerokość na podstawie czasu trwania
  const duration = daysBetween(node.dateStart, node.dateEnd)
  const calculatedWidth = duration * scale

  const isCircleShape = node.shape === "circle" || node.shape === "double-circle" || node.shape === "circle-x"
  const size = 48

  const width = isCircleShape || node.shape === "diamond" ? size : Math.max(calculatedWidth, minWidth)

  // Style dla różnych statusów
  const getStatusStyles = () => {
    switch (node.status) {
      case "completed":
        return { filter: "none", opacity: 1 }
      case "current":
        return { filter: "none", opacity: 1 }
      case "future":
        return { filter: "grayscale(0.4)", opacity: 0.6 }
      case "alternative":
        return { filter: "grayscale(0.3)", opacity: 0.5 }
      case "skipped":
        return { filter: "grayscale(1)", opacity: 0.3 }
      default:
        return { filter: "none", opacity: 1 }
    }
  }

  const statusStyles = getStatusStyles()

  if (isCircleShape || node.shape === "diamond") {
    const stageType = mapShapeToStageType(node.shape)
    return (
      <button
        onClick={onClick}
        className={`
          flex items-center justify-center cursor-pointer transition-all hover:brightness-110
          ${isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}
          ${node.status === "current" ? "ring-4 ring-red-500 ring-offset-2 ring-offset-background animate-pulse" : ""}
        `}
        style={statusStyles}
        title={node.name}
      >
        <StageSymbol type={stageType} color={colors.border} isOptional={isOptional} size={size} />
      </button>
    )
  }

  const borderStyle = isOptional ? "dashed" : "solid"
  const height = size * 0.7

  if (node.shape === "rectangle") {
    return (
      <button
        onClick={onClick}
        className={`
          flex items-center justify-center cursor-pointer transition-all hover:brightness-110 border-[4px]
          ${isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}
          ${node.status === "current" ? "ring-4 ring-red-500 ring-offset-2 ring-offset-background animate-pulse" : ""}
        `}
        style={{
          width,
          height,
          borderColor: colors.border,
          borderStyle,
          backgroundColor: `${colors.border}20`,
          ...statusStyles,
        }}
        title={node.name}
      />
    )
  }

  if (node.shape === "rounded-rect") {
    return (
      <button
        onClick={onClick}
        className={`
          flex items-center justify-center cursor-pointer transition-all hover:brightness-110 rounded-lg border-[3px]
          ${isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}
          ${node.status === "current" ? "ring-4 ring-red-500 ring-offset-2 ring-offset-background animate-pulse" : ""}
        `}
        style={{
          width,
          height,
          borderColor: colors.border,
          borderStyle,
          backgroundColor: `${colors.border}15`,
          ...statusStyles,
        }}
        title={node.name}
      />
    )
  }

  // Fallback
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center justify-center cursor-pointer transition-all hover:brightness-110 rounded border-[3px]
        ${isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}
        ${node.status === "current" ? "ring-4 ring-red-500 ring-offset-2 ring-offset-background animate-pulse" : ""}
      `}
      style={{
        width,
        height,
        borderColor: colors.border,
        borderStyle,
        backgroundColor: `${colors.border}15`,
        ...statusStyles,
      }}
      title={node.name}
    />
  )
}
