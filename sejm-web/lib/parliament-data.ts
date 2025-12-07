export interface PoliticalParty {
  id: string
  name: string
  shortName: string
  color: string
  seats: number
}

export interface ParliamentComposition {
  chamber: "sejm" | "senat"
  totalSeats: number
  parties: PoliticalParty[]
  majority: number // próg większości
}

// Sejm X kadencji (2023-2027)
export const SEJM_COMPOSITION: ParliamentComposition = {
  chamber: "sejm",
  totalSeats: 460,
  majority: 231,
  parties: [
    { id: "ko", name: "Koalicja Obywatelska", shortName: "KO", color: "#f97316", seats: 157 },
    { id: "pis", name: "Prawo i Sprawiedliwość", shortName: "PiS", color: "#1e3a8a", seats: 190 },
    { id: "td", name: "Trzecia Droga", shortName: "TD", color: "#eab308", seats: 65 },
    { id: "nl", name: "Nowa Lewica", shortName: "Lewica", color: "#dc2626", seats: 26 },
    { id: "konf", name: "Konfederacja", shortName: "Konf.", color: "#0d1b2a", seats: 18 },
    { id: "other", name: "Pozostali", shortName: "Inni", color: "#6b7280", seats: 4 },
  ],
}

// Senat XI kadencji (2023-2027)
export const SENAT_COMPOSITION: ParliamentComposition = {
  chamber: "senat",
  totalSeats: 100,
  majority: 51,
  parties: [
    { id: "ko", name: "Koalicja Obywatelska", shortName: "KO", color: "#f97316", seats: 41 },
    { id: "pis", name: "Prawo i Sprawiedliwość", shortName: "PiS", color: "#1e3a8a", seats: 34 },
    { id: "td", name: "Trzecia Droga", shortName: "TD", color: "#eab308", seats: 11 },
    { id: "nl", name: "Nowa Lewica", shortName: "Lewica", color: "#dc2626", seats: 9 },
    { id: "other", name: "Niezrzeszeni", shortName: "Niez.", color: "#6b7280", seats: 5 },
  ],
}

// Koalicja rządząca
export const RULING_COALITION = ["ko", "td", "nl"]

// Wynik głosowania
export interface VotingResult {
  for: number
  against: number
  abstained: number
  absent?: number
  byParty?: Record<string, { for: number; against: number; abstained: number }>
}

// Estymacja głosowania
export interface VotingEstimation {
  estimatedFor: number
  estimatedAgainst: number
  estimatedAbstained: number
  confidence: number // 0-100%
  supportingParties: string[]
  opposingParties: string[]
}

// Funkcja do estymacji głosowania na podstawie koalicji
export function estimateVoting(composition: ParliamentComposition, supportingPartyIds: string[]): VotingEstimation {
  let estimatedFor = 0
  let estimatedAgainst = 0
  const supportingParties: string[] = []
  const opposingParties: string[] = []

  composition.parties.forEach((party) => {
    if (supportingPartyIds.includes(party.id)) {
      estimatedFor += Math.round(party.seats * 0.95) // 95% dyscypliny
      supportingParties.push(party.shortName)
    } else {
      estimatedAgainst += Math.round(party.seats * 0.9) // 90% przeciw
      opposingParties.push(party.shortName)
    }
  })

  const estimatedAbstained = composition.totalSeats - estimatedFor - estimatedAgainst

  return {
    estimatedFor,
    estimatedAgainst,
    estimatedAbstained: Math.max(0, estimatedAbstained),
    confidence: 75,
    supportingParties,
    opposingParties,
  }
}

export const SEJM_PARTIES = SEJM_COMPOSITION.parties
export const SENATE_PARTIES = SENAT_COMPOSITION.parties
