import type { DbProcessStage, DbVoting, DbPrint, TimelineNode, SymbolShape, Institution } from "../types"

interface ProcessContext {
  stages: DbProcessStage[]
  votings: DbVoting[]
  prints: DbPrint[]
  isFinished: boolean
  isRejected: boolean
}

export function buildTimeline(context: ProcessContext): TimelineNode[] {
  const { stages, votings, prints, isFinished, isRejected } = context
  const nodes: TimelineNode[] = []

  if (stages.length === 0) return []

  let currentGroup: DbProcessStage[] = []
  
  const flushGroup = () => {
    if (currentGroup.length === 0) return
    
    const node = mapStagesToNode(currentGroup, votings, prints)
    if (node) {
      node.status = "completed" 
      nodes.push(node)
    }
    currentGroup = []
  }

  for (const stage of stages) {
    const name = stage.stage_name.toLowerCase()
    
    const isMajorEvent = 
        name.includes("wpłynął") || 
        name.includes("czytanie") || 
        (name.includes("senat") && (name.includes("uchwała") || name.includes("stanowisko"))) ||
        name.includes("prezydent") ||
        name.includes("ogłoszo") ||
        name.includes("odrzu")

    if (isMajorEvent) {
      if (currentGroup.length > 0) {
        flushGroup()
      }
      currentGroup.push(stage)
      flushGroup()
    } else {
      currentGroup.push(stage)
    }
  }
  
  flushGroup()

  if (!isFinished && !isRejected && nodes.length > 0) {
    nodes[nodes.length - 1].status = "current"
  }

  return nodes
}

function mapStagesToNode(group: DbProcessStage[], votings: DbVoting[], prints: DbPrint[]): TimelineNode | null {
  if (group.length === 0) return null
  
  const mainStage = group[group.length - 1]
  const name = mainStage.stage_name
  const lowerName = name.toLowerCase()
  
  let shape: SymbolShape = "circle"
  let institution: Institution = "sejm"
  
  if (lowerName.includes("wpłynął") || lowerName.includes("inicjatywa")) {
    shape = "circle"
    institution = "sejm"
  } else if (lowerName.includes("czytanie")) {
    shape = lowerName.includes("głosowanie") ? "diamond" : "rectangle"
    institution = "sejm"
  } else if (lowerName.includes("komis")) {
    shape = "rounded-rect"
    institution = lowerName.includes("senac") ? "senat" : "sejm"
  } else if (lowerName.includes("senat")) {
    shape = (lowerName.includes("stanowisko") || lowerName.includes("uchwała")) ? "diamond" : "rectangle"
    institution = "senat"
  } else if (lowerName.includes("prezydent")) {
    shape = "diamond"
    institution = "prezydent"
  } else if (lowerName.includes("trybunał")) {
    shape = "rounded-rect"
    institution = "trybunal"
  } else if (lowerName.includes("ogłoszo") || lowerName.includes("publikac")) {
    shape = "double-circle"
    institution = "publikacja"
  } else if (lowerName.includes("odrzu") || lowerName.includes("wycof")) {
    shape = "circle-x"
    institution = "sejm"
  }

  const dates = group.map(s => s.date).filter(Boolean) as string[]
  const dateStart = dates.length > 0 ? dates.sort()[0] : ""
  const dateEnd = dates.length > 0 ? dates.sort()[dates.length - 1] : ""

  let votingResult = undefined
  const votingNumbers = group.flatMap(s => s.voting_numbers || [])
  
  if (votingNumbers.length > 0) {
    const linkedVotings = votings.filter(v => votingNumbers.includes(v.voting_number))
    const mainVoting = linkedVotings.sort((a, b) => (b.yes_count + b.no_count) - (a.yes_count + a.no_count))[0]
    
    if (mainVoting) {
      votingResult = {
        for: mainVoting.yes_count,
        against: mainVoting.no_count,
        abstained: mainVoting.abstain_count
      }
      if (shape !== "diamond" && shape !== "circle-x") shape = "diamond"
    }
  }

  let documentNumber = undefined
  const textToSearch = group.map(s => s.stage_name + " " + (s.comment || "")).join(" ")
  const printMatch = textToSearch.match(/druk(?:u)?\s+nr\s+(\d+(?:-[A-Z]+)?)/i)
  if (printMatch) {
    documentNumber = `Druk nr ${printMatch[1]}`
  }

  const description = [...new Set(group.map(s => s.comment).filter(Boolean))].join("; ")

  return {
    id: `node-${mainStage.id}`,
    name: name,
    shortName: name.length > 30 ? name.substring(0, 28) + "..." : name,
    description: description,
    dateStart,
    dateEnd,
    shape,
    institution,
    status: "completed",
    votingResult,
    documentNumber
  }
}
