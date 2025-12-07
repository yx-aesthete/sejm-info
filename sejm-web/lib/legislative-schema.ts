export type SymbolShape =
  | "circle" // Okrąg - start/koniec (inicjatywa, publikacja, odrzucenie)
  | "rectangle" // Prostokąt z grubą ramką - czytania
  | "rounded-rect" // Zaokrąglony prostokąt - prace komisji
  | "diamond" // Romb - decyzje/głosowania
  | "double-circle" // Podwójny okrąg - zakończenie pozytywne
  | "circle-x" // Okrąg z X - odrzucenie

// Instytucja odpowiedzialna
export type Institution = "sejm" | "senat" | "prezydent" | "trybunal" | "publikacja"

// Typ inicjatora
export type InitiatorType = "president" | "government" | "deputies" | "senate" | "citizens" | "committee" | "other"

// Status etapu
export type StageStatus = "completed" | "current" | "future" | "skipped" | "alternative"

// =============================================
// PODSTAWOWY ELEMENT OSI CZASU (JSON Schema)
// =============================================
export interface TimelineNode {
  // Identyfikacja
  id: string
  name: string
  shortName: string
  description?: string

  // Daty (ISO 8601)
  dateStart: string // np. "2024-11-04"
  dateEnd: string // np. "2024-11-21"

  // Wizualizacja - warstwa 1: kształt
  shape: SymbolShape

  // Wizualizacja - warstwa 2: kolor instytucji
  institution: Institution

  // Status (dla widoku predykcyjnego)
  status: StageStatus

  // Metadane
  legalBasis?: string // Podstawa prawna
  votingResult?: {
    // Wynik głosowania (jeśli dotyczy)
    for: number
    against: number
    abstained: number
  }
  documentNumber?: string // Numer druku sejmowego

  // Dla etapów opcjonalnych
  isOptional?: boolean

  // Alternatywne ścieżki od tego punktu
  alternatives?: TimelineNode[]
}

// =============================================
// PEŁNA DEFINICJA PROCESU LEGISLACYJNEGO
// =============================================
export interface LegislativeProcess {
  // Metadane ustawy
  id: string
  title: string
  shortTitle: string
  documentNumber: string // Główny numer druku

  // Inicjator
  initiator: InitiatorType
  initiatorName: string // np. "Rada Ministrów", "Grupa posłów PO"

  // Status całego procesu
  processStatus: "in-progress" | "completed" | "rejected"

  // Linia czasu - sekwencja etapów
  timeline: TimelineNode[]

  // Data ostatniej aktualizacji
  lastUpdated: string

  // Link do źródła
  sourceUrl?: string
}

// =============================================
// KOLORY INSTYTUCJI
// =============================================
export const INSTITUTION_COLORS: Record<
  Institution,
  {
    bg: string
    border: string
    text: string
    label: string
  }
> = {
  sejm: { bg: "#ef4444", border: "#dc2626", text: "#ffffff", label: "Sejm" },
  senat: { bg: "#3b82f6", border: "#2563eb", text: "#ffffff", label: "Senat" },
  prezydent: { bg: "#8b5cf6", border: "#7c3aed", text: "#ffffff", label: "Prezydent" },
  trybunal: { bg: "#f59e0b", border: "#d97706", text: "#000000", label: "Trybunał Konstytucyjny" },
  publikacja: { bg: "#22c55e", border: "#16a34a", text: "#ffffff", label: "Publikacja" },
}

// =============================================
// KOLORY INICJATORÓW
// =============================================
export const INITIATOR_COLORS: Record<InitiatorType, string> = {
  president: "#dc2626",
  government: "#1e3a8a",
  deputies: "#f97316",
  senate: "#9333ea",
  citizens: "#16a34a",
  committee: "#6b7280",
  other: "#9ca3af",
}

// =============================================
// PRZYKŁADOWE PROCESY LEGISLACYJNE (PRAWDZIWE PRZYPADKI)
// =============================================

// Przykład 1: Ustawa o świadczeniach zdrowotnych (2024) - zakończona sukcesem
export const EXAMPLE_HEALTH_LAW_2024: LegislativeProcess = {
  id: "druk-764-2024",
  title: "Ustawa o zmianie ustawy o świadczeniach opieki zdrowotnej finansowanych ze środków publicznych",
  shortTitle: "Zmiana ustawy o świadczeniach zdrowotnych",
  documentNumber: "Druk nr 764",
  initiator: "government",
  initiatorName: "Rada Ministrów",
  processStatus: "completed",
  lastUpdated: "2024-12-19",
  sourceUrl: "https://www.sejm.gov.pl/sejm10.nsf/PrzebiegProc.xsp?id=C17D19F49487D6A8C1258BC700423461",
  timeline: [
    {
      id: "init-764",
      name: "Inicjatywa ustawodawcza",
      shortName: "Inicjatywa",
      description: "Złożenie rządowego projektu ustawy",
      dateStart: "2024-11-04",
      dateEnd: "2024-11-04",
      shape: "circle",
      institution: "sejm",
      status: "completed",
      documentNumber: "Druk nr 764",
    },
    {
      id: "reading1-764",
      name: "I Czytanie",
      shortName: "I Czytanie",
      description:
        "Pierwsze czytanie na posiedzeniu plenarnym. Wniosek o odrzucenie: 5 za, 432 przeciw, 5 wstrzymało się.",
      dateStart: "2024-11-21",
      dateEnd: "2024-11-21",
      shape: "rectangle",
      institution: "sejm",
      status: "completed",
      votingResult: { for: 5, against: 432, abstained: 5 },
      legalBasis: "Art. 119 Konstytucji RP",
    },
    {
      id: "committee-764",
      name: "Prace komisji sejmowej",
      shortName: "Komisja FP + ZDR",
      description: "Prace Komisji Finansów Publicznych oraz Komisji Zdrowia",
      dateStart: "2024-11-21",
      dateEnd: "2024-11-26",
      shape: "rounded-rect",
      institution: "sejm",
      status: "completed",
      documentNumber: "Druk nr 851",
    },
    {
      id: "reading2-764",
      name: "II Czytanie",
      shortName: "II Czytanie",
      description: "Drugie czytanie, ponowne skierowanie do komisji",
      dateStart: "2024-11-27",
      dateEnd: "2024-11-27",
      shape: "rectangle",
      institution: "sejm",
      status: "completed",
      documentNumber: "Druk nr 851-A",
    },
    {
      id: "reading3-764",
      name: "III Czytanie (głosowanie)",
      shortName: "III Czytanie",
      description: "Głosowanie końcowe: 248 za, 6 przeciw, 171 wstrzymało się",
      dateStart: "2024-11-27",
      dateEnd: "2024-11-27",
      shape: "diamond",
      institution: "sejm",
      status: "completed",
      votingResult: { for: 248, against: 6, abstained: 171 },
      legalBasis: "Art. 120 Konstytucji RP",
    },
    {
      id: "senate-committee-764",
      name: "Komisja senacka",
      shortName: "Komisja Sen.",
      description: "Prace komisji senackich",
      dateStart: "2024-11-29",
      dateEnd: "2024-12-04",
      shape: "rounded-rect",
      institution: "senat",
      status: "completed",
    },
    {
      id: "senate-vote-764",
      name: "Głosowanie Senatu",
      shortName: "Głos. Senatu",
      description: "Senat wprowadził poprawki",
      dateStart: "2024-12-04",
      dateEnd: "2024-12-04",
      shape: "diamond",
      institution: "senat",
      status: "completed",
      documentNumber: "Druk nr 884",
    },
    {
      id: "sejm-response-764",
      name: "Odpowiedź Sejmu na stanowisko Senatu",
      shortName: "Odp. Sejmu",
      description: "Sejm przyjął poprawki Senatu",
      dateStart: "2024-12-05",
      dateEnd: "2024-12-06",
      shape: "diamond",
      institution: "sejm",
      status: "completed",
      documentNumber: "Druk nr 888",
    },
    {
      id: "president-764",
      name: "Decyzja Prezydenta",
      shortName: "Podpis Prez.",
      description: "Prezydent podpisał ustawę",
      dateStart: "2024-12-09",
      dateEnd: "2024-12-19",
      shape: "diamond",
      institution: "prezydent",
      status: "completed",
    },
    {
      id: "publication-764",
      name: "Publikacja w Dzienniku Ustaw",
      shortName: "Publikacja",
      description: "Dz.U. poz. 1915",
      dateStart: "2024-12-19",
      dateEnd: "2024-12-19",
      shape: "circle",
      institution: "publikacja",
      status: "completed",
      documentNumber: "Dz.U. poz. 1915",
    },
  ],
}

// Przykład 2: Ustawa budżetowa 2025 (w trakcie)
export const EXAMPLE_BUDGET_2025: LegislativeProcess = {
  id: "budget-2025",
  title: "Ustawa budżetowa na rok 2025",
  shortTitle: "Budżet 2025",
  documentNumber: "Druk nr 900",
  initiator: "government",
  initiatorName: "Rada Ministrów",
  processStatus: "in-progress",
  lastUpdated: "2024-12-01",
  timeline: [
    {
      id: "init-budget-2025",
      name: "Inicjatywa ustawodawcza",
      shortName: "Inicjatywa",
      description: "Złożenie projektu ustawy budżetowej przez Radę Ministrów",
      dateStart: "2024-09-30",
      dateEnd: "2024-09-30",
      shape: "circle",
      institution: "sejm",
      status: "completed",
      legalBasis: "Art. 222 Konstytucji RP",
    },
    {
      id: "reading1-budget",
      name: "I Czytanie",
      shortName: "I Czytanie",
      description: "Pierwsze czytanie projektu budżetu na posiedzeniu plenarnym",
      dateStart: "2024-10-15",
      dateEnd: "2024-10-16",
      shape: "rectangle",
      institution: "sejm",
      status: "completed",
    },
    {
      id: "committee-budget",
      name: "Prace Komisji Finansów Publicznych",
      shortName: "Komisja FP",
      description: "Szczegółowe prace nad budżetem w komisji",
      dateStart: "2024-10-17",
      dateEnd: "2024-11-30",
      shape: "rounded-rect",
      institution: "sejm",
      status: "current",
    },
    {
      id: "reading2-budget",
      name: "II Czytanie",
      shortName: "II Czytanie",
      description: "Drugie czytanie projektu budżetu",
      dateStart: "2024-12-10",
      dateEnd: "2024-12-10",
      shape: "rectangle",
      institution: "sejm",
      status: "future",
    },
    {
      id: "reading3-budget",
      name: "III Czytanie (głosowanie)",
      shortName: "III Czytanie",
      description: "Głosowanie nad ustawą budżetową",
      dateStart: "2024-12-15",
      dateEnd: "2024-12-15",
      shape: "diamond",
      institution: "sejm",
      status: "future",
      alternatives: [
        {
          id: "rejection-budget",
          name: "Odrzucenie budżetu",
          shortName: "Odrzucenie",
          description: "Odrzucenie projektu budżetu przez Sejm",
          dateStart: "2024-12-15",
          dateEnd: "2024-12-15",
          shape: "circle",
          institution: "sejm",
          status: "alternative",
        },
      ],
    },
    {
      id: "senate-budget",
      name: "Głosowanie Senatu",
      shortName: "Głos. Senatu",
      description: "Senat ma 20 dni na rozpatrzenie ustawy budżetowej",
      dateStart: "2024-12-16",
      dateEnd: "2025-01-05",
      shape: "diamond",
      institution: "senat",
      status: "future",
      legalBasis: "Art. 223 Konstytucji RP",
    },
    {
      id: "president-budget",
      name: "Decyzja Prezydenta",
      shortName: "Decyzja Prez.",
      description: "Prezydent ma 7 dni na podpisanie ustawy budżetowej",
      dateStart: "2025-01-06",
      dateEnd: "2025-01-13",
      shape: "diamond",
      institution: "prezydent",
      status: "future",
      legalBasis: "Art. 224 Konstytucji RP",
      alternatives: [
        {
          id: "tk-budget",
          name: "Trybunał Konstytucyjny",
          shortName: "TK",
          description: "Skierowanie do TK",
          dateStart: "2025-01-06",
          dateEnd: "2025-03-06",
          shape: "rounded-rect",
          institution: "trybunal",
          status: "alternative",
          isOptional: true,
        },
      ],
    },
    {
      id: "publication-budget",
      name: "Publikacja",
      shortName: "Publikacja",
      description: "Publikacja w Dzienniku Ustaw",
      dateStart: "2025-01-14",
      dateEnd: "2025-01-14",
      shape: "circle",
      institution: "publikacja",
      status: "future",
    },
  ],
}

// Przykład 3: Obywatelski projekt ustawy (hipotetyczny)
export const EXAMPLE_CITIZEN_INITIATIVE: LegislativeProcess = {
  id: "citizen-housing-2024",
  title: "Obywatelski projekt ustawy o wsparciu budownictwa mieszkaniowego",
  shortTitle: "Ustawa mieszkaniowa (obywatelska)",
  documentNumber: "Druk nr 500",
  initiator: "citizens",
  initiatorName: 'Komitet Inicjatywy Ustawodawczej "Mieszkanie dla każdego"',
  processStatus: "in-progress",
  lastUpdated: "2024-11-15",
  timeline: [
    {
      id: "init-citizen",
      name: "Inicjatywa obywatelska",
      shortName: "Inicjatywa",
      description: "Złożenie 150 000 podpisów poparcia dla projektu",
      dateStart: "2024-06-01",
      dateEnd: "2024-09-01",
      shape: "circle",
      institution: "sejm",
      status: "completed",
      legalBasis: "Art. 118 ust. 2 Konstytucji RP",
    },
    {
      id: "reading1-citizen",
      name: "I Czytanie",
      shortName: "I Czytanie",
      description: "Pierwsze czytanie - przedstawiciel komitetu przedstawia projekt",
      dateStart: "2024-10-10",
      dateEnd: "2024-10-10",
      shape: "rectangle",
      institution: "sejm",
      status: "completed",
    },
    {
      id: "committee-citizen",
      name: "Prace komisji",
      shortName: "Komisja",
      description: "Prace Komisji Infrastruktury",
      dateStart: "2024-10-11",
      dateEnd: "2024-12-15",
      shape: "rounded-rect",
      institution: "sejm",
      status: "current",
    },
    {
      id: "reading2-citizen",
      name: "II Czytanie",
      shortName: "II Czytanie",
      dateStart: "2025-01-15",
      dateEnd: "2025-01-15",
      shape: "rectangle",
      institution: "sejm",
      status: "future",
    },
    {
      id: "reading3-citizen",
      name: "III Czytanie",
      shortName: "III Czytanie",
      dateStart: "2025-01-20",
      dateEnd: "2025-01-20",
      shape: "diamond",
      institution: "sejm",
      status: "future",
      alternatives: [
        {
          id: "rejection-citizen",
          name: "Odrzucenie projektu",
          shortName: "Odrzucenie",
          dateStart: "2025-01-20",
          dateEnd: "2025-01-20",
          shape: "circle",
          institution: "sejm",
          status: "alternative",
        },
      ],
    },
    {
      id: "senate-citizen",
      name: "Głosowanie Senatu",
      shortName: "Głos. Senatu",
      dateStart: "2025-01-21",
      dateEnd: "2025-02-20",
      shape: "diamond",
      institution: "senat",
      status: "future",
    },
    {
      id: "president-citizen",
      name: "Decyzja Prezydenta",
      shortName: "Decyzja Prez.",
      dateStart: "2025-02-21",
      dateEnd: "2025-03-14",
      shape: "diamond",
      institution: "prezydent",
      status: "future",
      alternatives: [
        {
          id: "veto-citizen",
          name: "Weto prezydenckie",
          shortName: "Weto",
          dateStart: "2025-02-21",
          dateEnd: "2025-03-14",
          shape: "diamond",
          institution: "prezydent",
          status: "alternative",
        },
      ],
    },
    {
      id: "publication-citizen",
      name: "Publikacja",
      shortName: "Publikacja",
      dateStart: "2025-03-15",
      dateEnd: "2025-03-15",
      shape: "circle",
      institution: "publikacja",
      status: "future",
    },
  ],
}

// Lista wszystkich przykładów
export const EXAMPLE_PROCESSES: LegislativeProcess[] = [
  EXAMPLE_HEALTH_LAW_2024,
  EXAMPLE_BUDGET_2025,
  EXAMPLE_CITIZEN_INITIATIVE,
]

// Funkcja pomocnicza do obliczania dni między datami
export function daysBetween(dateStart: string, dateEnd: string): number {
  const start = new Date(dateStart)
  const end = new Date(dateEnd)
  const diff = Math.abs(end.getTime() - start.getTime())
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

// Funkcja do formatowania daty
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}
