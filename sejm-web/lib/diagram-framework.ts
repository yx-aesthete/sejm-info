import { INSTITUTION_COLORS, type TimelineNode, type SymbolShape, type Institution } from "./legislative-schema"

// =============================================
// KONFIGURACJA SIATKI
// =============================================
export interface GridConfig {
  cellSize: number
  symbolSize: number
  padding: number
  lineHeight: number
  labelOffset: number
  rowHeight: number
}

export const DEFAULT_GRID: GridConfig = {
  cellSize: 140,
  symbolSize: 56,
  padding: 80,
  lineHeight: 3,
  labelOffset: 16,
  rowHeight: 180,
}

// =============================================
// PUNKT NA SIATCE
// =============================================
export interface GridPoint {
  col: number
  row: number
}

// =============================================
// ELEMENT DIAGRAMU
// =============================================
export interface DiagramNode extends TimelineNode {
  gridPosition: GridPoint
  centerX: number
  centerY: number
  width: number
  height: number
}

// =============================================
// LINIA ŁĄCZĄCA
// =============================================
export interface ConnectorLine {
  fromNode: DiagramNode
  toNode: DiagramNode
  daysBetween: number
  isAlternative: boolean
}

// =============================================
// OBLICZANIE WYMIARÓW SYMBOLU (identyczne jak stage-symbol.tsx)
// =============================================
export function getSymbolDimensions(
  shape: SymbolShape,
  baseSize: number,
  durationDays = 1,
  isProportional = false,
): { width: number; height: number } {
  switch (shape) {
    case "circle":
    case "double-circle":
    case "circle-x":
      return { width: baseSize, height: baseSize }
    case "rectangle":
      // W trybie proporcjonalnym szerokość zależy od czasu trwania
      if (isProportional && durationDays > 1) {
        return { width: Math.max(baseSize, baseSize * 0.7 + durationDays * 3), height: baseSize * 0.7 }
      }
      return { width: baseSize, height: baseSize * 0.7 }
    case "rounded-rect":
      // W trybie proporcjonalnym szerokość zależy od czasu trwania (komisje mogą trwać długo)
      if (isProportional && durationDays > 1) {
        return { width: Math.max(baseSize, baseSize * 0.7 + durationDays * 3), height: baseSize * 0.7 }
      }
      return { width: baseSize, height: baseSize * 0.7 }
    case "diamond":
      return { width: baseSize * 0.7, height: baseSize * 0.7 }
    default:
      return { width: baseSize, height: baseSize }
  }
}

// =============================================
// POZYCJONOWANIE WĘZŁÓW - TRYB SEKWENCYJNY (siatka)
// =============================================
export function layoutNodesSequential(
  nodes: TimelineNode[],
  config: GridConfig = DEFAULT_GRID,
  showAlternatives = true,
): { nodes: DiagramNode[]; connectors: ConnectorLine[]; totalWidth: number; totalHeight: number } {
  const diagramNodes: DiagramNode[] = []
  const connectors: ConnectorLine[] = []

  nodes.forEach((node, index) => {
    const gridPosition: GridPoint = { col: index, row: 0 }
    const dims = getSymbolDimensions(node.shape, config.symbolSize)

    const centerX = config.padding + index * config.cellSize + config.cellSize / 2
    const centerY = config.padding + config.symbolSize / 2 + 20

    const diagramNode: DiagramNode = {
      ...node,
      gridPosition,
      centerX,
      centerY,
      width: dims.width,
      height: dims.height,
    }
    diagramNodes.push(diagramNode)

    // Alternatywy poniżej - tylko jeśli showAlternatives
    if (showAlternatives && node.alternatives) {
      node.alternatives.forEach((alt, altIndex) => {
        const altDims = getSymbolDimensions(alt.shape, config.symbolSize * 0.85)
        const altCenterX = centerX + config.cellSize * 0.5
        const altCenterY = centerY + config.rowHeight * (altIndex + 1)

        const altDiagramNode: DiagramNode = {
          ...alt,
          gridPosition: { col: index + 1, row: altIndex + 1 },
          centerX: altCenterX,
          centerY: altCenterY,
          width: altDims.width,
          height: altDims.height,
        }
        diagramNodes.push(altDiagramNode)

        connectors.push({
          fromNode: diagramNode,
          toNode: altDiagramNode,
          daysBetween: 0,
          isAlternative: true,
        })
      })
    }
  })

  // Łączniki między węzłami głównymi
  const mainNodes = diagramNodes.filter((n) => n.gridPosition.row === 0)
  for (let i = 0; i < mainNodes.length - 1; i++) {
    const from = mainNodes[i]
    const to = mainNodes[i + 1]
    const daysBetween = calculateDaysBetween(from.dateEnd, to.dateStart)

    connectors.push({
      fromNode: from,
      toNode: to,
      daysBetween,
      isAlternative: false,
    })
  }

  const maxCol = Math.max(...diagramNodes.map((n) => n.gridPosition.col))
  const maxRow = Math.max(...diagramNodes.map((n) => n.gridPosition.row))
  const totalWidth = config.padding * 2 + (maxCol + 1) * config.cellSize
  const totalHeight = config.padding * 2 + (maxRow + 1) * config.rowHeight + 140

  return { nodes: diagramNodes, connectors, totalWidth, totalHeight }
}

// =============================================
// POZYCJONOWANIE WĘZŁÓW - TRYB PROPORCJONALNY (czas → szerokość)
// Z GWARANCJĄ BRAKU NAKŁADANIA
// =============================================
export function layoutNodesProportional(
  nodes: TimelineNode[],
  config: GridConfig = DEFAULT_GRID,
  pixelsPerDay = 8,
  minGap = 120,
  showAlternatives = true,
): { nodes: DiagramNode[]; connectors: ConnectorLine[]; totalWidth: number; totalHeight: number } {
  const diagramNodes: DiagramNode[] = []
  const connectors: ConnectorLine[] = []

  if (nodes.length === 0) {
    return { nodes: [], connectors: [], totalWidth: 0, totalHeight: 0 }
  }

  const centerY = config.padding + config.symbolSize / 2 + 20

  const nodesWithDims = nodes.map((node) => {
    const nodeStart = new Date(node.dateStart).getTime()
    const nodeEnd = new Date(node.dateEnd).getTime()
    const durationDays = Math.max(1, Math.ceil((nodeEnd - nodeStart) / (1000 * 60 * 60 * 24)))
    const dims = getSymbolDimensions(node.shape, config.symbolSize, durationDays, true)
    return { node, dims, durationDays }
  })

  // Pozycjonowanie z gwarancją braku nakładania
  let currentRightEdge = config.padding

  nodesWithDims.forEach((item, index) => {
    const { node, dims, durationDays } = item

    // Szerokość tego elementu
    let nodeWidth = dims.width
    // W trybie proporcjonalnym prostokąty i zaokrąglone prostokąty rozciągają się
    if ((node.shape === "rectangle" || node.shape === "rounded-rect") && durationDays > 1) {
      nodeWidth = Math.max(dims.width, durationDays * pixelsPerDay)
    }

    // Pozycja X = poprzednia krawędź + minGap + połowa szerokości tego elementu
    const gapToUse = index === 0 ? 0 : minGap
    const centerX = currentRightEdge + gapToUse + nodeWidth / 2

    const diagramNode: DiagramNode = {
      ...node,
      gridPosition: { col: index, row: 0 },
      centerX,
      centerY,
      width: nodeWidth,
      height: dims.height,
    }
    diagramNodes.push(diagramNode)

    // Aktualizuj prawą krawędź
    currentRightEdge = centerX + nodeWidth / 2

    // Alternatywy - tylko jeśli showAlternatives
    if (showAlternatives && node.alternatives) {
      node.alternatives.forEach((alt, altIndex) => {
        const altDims = getSymbolDimensions(alt.shape, config.symbolSize * 0.85)
        const altCenterX = centerX + minGap * 0.6
        const altCenterY = centerY + config.rowHeight * (altIndex + 1)

        const altDiagramNode: DiagramNode = {
          ...alt,
          gridPosition: { col: index + 1, row: altIndex + 1 },
          centerX: altCenterX,
          centerY: altCenterY,
          width: altDims.width,
          height: altDims.height,
        }
        diagramNodes.push(altDiagramNode)

        connectors.push({
          fromNode: diagramNode,
          toNode: altDiagramNode,
          daysBetween: 0,
          isAlternative: true,
        })
      })
    }
  })

  // Łączniki
  const mainNodes = diagramNodes.filter((n) => n.gridPosition.row === 0)
  for (let i = 0; i < mainNodes.length - 1; i++) {
    const from = mainNodes[i]
    const to = mainNodes[i + 1]
    const daysBetween = calculateDaysBetween(from.dateEnd, to.dateStart)

    connectors.push({
      fromNode: from,
      toNode: to,
      daysBetween,
      isAlternative: false,
    })
  }

  const maxX = Math.max(...diagramNodes.map((n) => n.centerX + n.width / 2))
  const maxRow = Math.max(...diagramNodes.map((n) => n.gridPosition.row))
  const totalWidth = maxX + config.padding
  const totalHeight = config.padding * 2 + (maxRow + 1) * config.rowHeight + 140

  return { nodes: diagramNodes, connectors, totalWidth, totalHeight }
}

function calculateDaysBetween(dateEnd: string, dateStart: string): number {
  const end = new Date(dateEnd)
  const start = new Date(dateStart)
  const diff = Math.abs(start.getTime() - end.getTime())
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

// =============================================
// RYSOWANIE SYMBOLI - IDENTYCZNE JAK W stage-symbol.tsx
// =============================================
export function drawSymbol(
  ctx: CanvasRenderingContext2D,
  shape: SymbolShape,
  cx: number,
  cy: number,
  width: number,
  height: number,
  institution: Institution,
  isOptional = false,
  status = "completed",
  isCurrent = false,
  isSelected = false,
): void {
  const colors = INSTITUTION_COLORS[institution]
  const alpha = status === "future" || status === "alternative" ? 0.4 : 1

  ctx.save()
  ctx.globalAlpha = alpha

  const borderWidth = shape === "rectangle" ? 4 : 3
  ctx.lineWidth = borderWidth
  ctx.strokeStyle = status === "alternative" ? "#9ca3af" : colors.border

  let bgAlpha = "15"
  if (shape === "rectangle" || shape === "diamond") bgAlpha = "20"
  if (shape === "circle-x") bgAlpha = "10"
  ctx.fillStyle = `${colors.bg}${bgAlpha}`

  if (isOptional) {
    ctx.setLineDash([6, 4])
  }

  switch (shape) {
    case "circle":
      drawCircle(ctx, cx, cy, width / 2)
      break
    case "double-circle":
      drawDoubleCircle(ctx, cx, cy, width / 2, colors.border, colors.bg)
      break
    case "circle-x":
      drawCircleX(ctx, cx, cy, width / 2, colors.border)
      break
    case "rectangle":
      drawRectangle(ctx, cx, cy, width, height)
      break
    case "rounded-rect":
      drawRoundedRect(ctx, cx, cy, width, height, 8)
      break
    case "diamond":
      drawDiamond(ctx, cx, cy, Math.max(width, height))
      break
  }

  if (isSelected) {
    ctx.setLineDash([])
    ctx.strokeStyle = "#3b82f6"
    ctx.lineWidth = 3
    ctx.globalAlpha = 1

    if (shape === "circle" || shape === "double-circle" || shape === "circle-x") {
      ctx.beginPath()
      ctx.arc(cx, cy, width / 2 + 6, 0, Math.PI * 2)
      ctx.stroke()
    } else if (shape === "diamond") {
      drawDiamond(ctx, cx, cy, Math.max(width, height) + 12, true)
    } else {
      drawRoundedRect(ctx, cx, cy, width + 12, height + 12, 10, true)
    }
  }

  // Pulsująca obwódka dla obecnego etapu (żółta)
  if (isCurrent && !isSelected) {
    ctx.setLineDash([])
    ctx.strokeStyle = "#fbbf24"
    ctx.lineWidth = 4
    ctx.globalAlpha = 1

    if (shape === "circle" || shape === "double-circle" || shape === "circle-x") {
      ctx.beginPath()
      ctx.arc(cx, cy, width / 2 + 8, 0, Math.PI * 2)
      ctx.stroke()
    } else if (shape === "diamond") {
      drawDiamond(ctx, cx, cy, Math.max(width, height) + 16, true)
    } else {
      drawRoundedRect(ctx, cx, cy, width + 16, height + 16, 10, true)
    }
  }

  ctx.restore()
}

function drawCircle(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number): void {
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
}

function drawDoubleCircle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  borderColor: string,
  bgColor: string,
): void {
  // Zewnętrzny okrąg - delikatne tło
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.fillStyle = `${bgColor}15`
  ctx.fill()
  ctx.strokeStyle = borderColor
  ctx.lineWidth = 3
  ctx.stroke()

  // Wewnętrzny okrąg - WYPEŁNIONY kolorem border
  ctx.beginPath()
  ctx.arc(cx, cy, radius * 0.5, 0, Math.PI * 2)
  ctx.fillStyle = borderColor
  ctx.fill()
}

function drawCircleX(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, borderColor: string): void {
  // Zewnętrzny okrąg
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.fillStyle = "#f5f5f5"
  ctx.fill()
  ctx.strokeStyle = borderColor
  ctx.lineWidth = 3
  ctx.stroke()

  // X w środku
  const xSize = radius * 0.45
  ctx.beginPath()
  ctx.strokeStyle = borderColor
  ctx.lineWidth = 4
  ctx.lineCap = "round"
  ctx.moveTo(cx - xSize, cy - xSize)
  ctx.lineTo(cx + xSize, cy + xSize)
  ctx.moveTo(cx + xSize, cy - xSize)
  ctx.lineTo(cx - xSize, cy + xSize)
  ctx.stroke()
  ctx.lineCap = "butt"
}

function drawRectangle(ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, h: number): void {
  const x = cx - w / 2
  const y = cy - h / 2
  ctx.fillRect(x, y, w, h)
  ctx.strokeRect(x, y, w, h)
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  w: number,
  h: number,
  r: number,
  strokeOnly = false,
): void {
  const x = cx - w / 2
  const y = cy - h / 2

  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()

  if (!strokeOnly) ctx.fill()
  ctx.stroke()
}

function drawDiamond(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, strokeOnly = false): void {
  const half = size / 2

  ctx.beginPath()
  ctx.moveTo(cx, cy - half)
  ctx.lineTo(cx + half, cy)
  ctx.lineTo(cx, cy + half)
  ctx.lineTo(cx - half, cy)
  ctx.closePath()

  if (!strokeOnly) ctx.fill()
  ctx.stroke()
}

// =============================================
// RYSOWANIE LINII ŁĄCZĄCYCH
// =============================================
export function drawConnector(ctx: CanvasRenderingContext2D, connector: ConnectorLine, config: GridConfig): void {
  ctx.save()

  const { fromNode, toNode, isAlternative, daysBetween } = connector

  ctx.lineWidth = isAlternative ? 2 : 3
  ctx.strokeStyle = isAlternative ? "#9ca3af" : INSTITUTION_COLORS[toNode.institution].border

  if (isAlternative) {
    ctx.setLineDash([6, 4])
    ctx.globalAlpha = 0.5
  }

  // Punkty połączenia na krawędziach symboli
  const startX = fromNode.centerX + fromNode.width / 2
  const startY = fromNode.centerY
  const endX = toNode.centerX - toNode.width / 2
  const endY = toNode.centerY

  if (isAlternative) {
    // Linia łamana dla alternatyw - w dół potem w prawo
    const cornerY = toNode.centerY

    ctx.beginPath()
    ctx.moveTo(fromNode.centerX, fromNode.centerY + fromNode.height / 2)
    ctx.lineTo(fromNode.centerX, cornerY)
    ctx.lineTo(toNode.centerX - toNode.width / 2, cornerY)
    ctx.stroke()
  } else {
    // Prosta linia pozioma
    ctx.beginPath()
    ctx.moveTo(startX, startY)
    ctx.lineTo(endX, endY)
    ctx.stroke()

    // Etykieta z dniami na środku linii
    if (daysBetween > 0) {
      const midX = (startX + endX) / 2
      const midY = startY

      ctx.setLineDash([])
      ctx.globalAlpha = 1

      const text = `${daysBetween} ${daysBetween === 1 ? "dzień" : "dni"}`
      ctx.font = "11px system-ui, sans-serif"
      const textWidth = ctx.measureText(text).width
      const pillWidth = textWidth + 16
      const pillHeight = 20

      // Pill tło
      ctx.fillStyle = "#ffffff"
      ctx.strokeStyle = "#e5e7eb"
      ctx.lineWidth = 1

      const pillX = midX - pillWidth / 2
      const pillY = midY - pillHeight / 2
      const pillR = pillHeight / 2

      ctx.beginPath()
      ctx.moveTo(pillX + pillR, pillY)
      ctx.lineTo(pillX + pillWidth - pillR, pillY)
      ctx.arc(pillX + pillWidth - pillR, pillY + pillR, pillR, -Math.PI / 2, Math.PI / 2)
      ctx.lineTo(pillX + pillR, pillY + pillHeight)
      ctx.arc(pillX + pillR, pillY + pillR, pillR, Math.PI / 2, -Math.PI / 2)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()

      ctx.fillStyle = "#6b7280"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(text, midX, midY)
    }
  }

  ctx.restore()
}

// =============================================
// RYSOWANIE ETYKIET
// =============================================
export function drawLabel(ctx: CanvasRenderingContext2D, node: DiagramNode, config: GridConfig): void {
  ctx.save()

  const { centerX, centerY, height, shortName, institution, dateStart, dateEnd, status } = node
  const labelY = centerY + height / 2 + config.labelOffset

  ctx.textAlign = "center"
  ctx.globalAlpha = status === "future" || status === "alternative" ? 0.5 : 1

  const colors = INSTITUTION_COLORS[institution]

  // Nazwa etapu
  ctx.font = "bold 12px system-ui, sans-serif"
  ctx.fillStyle = colors.border
  ctx.fillText(shortName, centerX, labelY + 12)

  // Instytucja
  ctx.font = "11px system-ui, sans-serif"
  ctx.fillStyle = "#6b7280"
  ctx.fillText(colors.label, centerX, labelY + 28)

  // Czas trwania
  const days = calculateDaysBetween(dateStart, dateEnd) + 1
  const daysText = days === 1 ? "1 dzień" : `${days} dni`
  ctx.font = "10px system-ui, sans-serif"
  ctx.fillStyle = "#9ca3af"
  ctx.fillText(daysText, centerX, labelY + 44)

  // Zakres dat
  const startDate = new Date(dateStart).toLocaleDateString("pl-PL", { day: "numeric", month: "short" })
  const endDate = new Date(dateEnd).toLocaleDateString("pl-PL", { day: "numeric", month: "short" })
  const dateRange = startDate === endDate ? startDate : `${startDate} → ${endDate}`
  ctx.fillText(dateRange, centerX, labelY + 58)

  ctx.restore()
}

// =============================================
// RYSOWANIE LINII "TERAZ"
// =============================================
export function drawNowLine(ctx: CanvasRenderingContext2D, x: number, height: number): void {
  ctx.save()

  ctx.strokeStyle = "#ef4444"
  ctx.lineWidth = 2
  ctx.setLineDash([8, 4])

  ctx.beginPath()
  ctx.moveTo(x, 40)
  ctx.lineTo(x, height - 20)
  ctx.stroke()

  ctx.setLineDash([])
  ctx.fillStyle = "#ef4444"
  ctx.font = "bold 11px system-ui, sans-serif"
  ctx.textAlign = "center"
  ctx.fillText("TERAZ", x, 30)

  ctx.restore()
}

// =============================================
// RYSOWANIE OSI CZASU
// =============================================
export function drawTimeAxis(ctx: CanvasRenderingContext2D, nodes: DiagramNode[], y: number): void {
  ctx.save()

  const mainNodes = nodes.filter((n) => n.gridPosition.row === 0)
  if (mainNodes.length === 0) return

  const startX = mainNodes[0].centerX - 30
  const endX = mainNodes[mainNodes.length - 1].centerX + 30

  ctx.strokeStyle = "#e5e7eb"
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(startX, y)
  ctx.lineTo(endX, y)
  ctx.stroke()

  // Kropki dla każdego etapu
  mainNodes.forEach((node) => {
    ctx.fillStyle = "#9ca3af"
    ctx.beginPath()
    ctx.arc(node.centerX, y, 5, 0, Math.PI * 2)
    ctx.fill()
  })

  ctx.restore()
}

// =============================================
// ZNAJDOWANIE POZYCJI LINII TERAZ
// =============================================
export function findNowLinePosition(nodes: DiagramNode[]): number | null {
  const mainNodes = nodes.filter((n) => n.gridPosition.row === 0)
  const currentNode = mainNodes.find((n) => n.status === "current")

  if (currentNode) {
    return currentNode.centerX
  }

  // Jeśli nie ma current, znajdź pozycję między ostatnim completed a pierwszym future
  const lastCompleted = mainNodes.filter((n) => n.status === "completed").pop()
  const firstFuture = mainNodes.find((n) => n.status === "future")

  if (lastCompleted && firstFuture) {
    return (lastCompleted.centerX + lastCompleted.width / 2 + firstFuture.centerX - firstFuture.width / 2) / 2
  }

  if (lastCompleted) {
    return lastCompleted.centerX + lastCompleted.width / 2 + 20
  }

  return null
}

// =============================================
// PEŁNE RENDEROWANIE
// =============================================
export function renderDiagram(
  ctx: CanvasRenderingContext2D,
  nodes: DiagramNode[],
  connectors: ConnectorLine[],
  config: GridConfig,
  currentNodeId?: string,
  showNowLine = true,
  showAlternatives = true,
  selectedNodeId?: string | null,
): void {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  const mainNodes = nodes.filter((n) => n.gridPosition.row === 0)
  const altNodes = nodes.filter((n) => n.gridPosition.row > 0)

  // 1. Łączniki (pod symbolami)
  connectors.forEach((c) => {
    if (c.isAlternative && !showAlternatives) return
    drawConnector(ctx, c, config)
  })

  // 2. Symbole główne
  mainNodes.forEach((node) => {
    const isCurrent = node.id === currentNodeId || node.status === "current"
    const isSelected = node.id === selectedNodeId
    drawSymbol(
      ctx,
      node.shape,
      node.centerX,
      node.centerY,
      node.width,
      node.height,
      node.institution,
      node.isOptional,
      node.status,
      isCurrent,
      isSelected,
    )
  })

  // 3. Symbole alternatywne - tylko jeśli showAlternatives
  if (showAlternatives) {
    altNodes.forEach((node) => {
      const isSelected = node.id === selectedNodeId
      drawSymbol(
        ctx,
        node.shape,
        node.centerX,
        node.centerY,
        node.width,
        node.height,
        node.institution,
        node.isOptional,
        node.status,
        false,
        isSelected,
      )
    })
  }

  // 4. Etykiety
  const nodesToLabel = showAlternatives ? nodes : mainNodes
  nodesToLabel.forEach((node) => drawLabel(ctx, node, config))

  // 5. Oś czasu
  const maxRow = Math.max(...nodes.map((n) => n.gridPosition.row), 0)
  const axisY = config.padding + (showAlternatives ? maxRow : 0) * config.rowHeight + config.symbolSize + 100
  drawTimeAxis(ctx, nodes, axisY)

  // 6. Linia TERAZ - zawsze widoczna jeśli showNowLine
  if (showNowLine) {
    const nowX = findNowLinePosition(mainNodes)
    if (nowX !== null) {
      const height = config.padding + (showAlternatives ? maxRow : 0) * config.rowHeight + config.symbolSize + 120
      drawNowLine(ctx, nowX, height)
    }
  }
}
