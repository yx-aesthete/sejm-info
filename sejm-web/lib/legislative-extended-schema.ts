import type { LegislativeProcess, TimelineNode, InitiatorType } from "./legislative-schema"
import {
  Coins,
  HeartPulse,
  GraduationCap,
  Building2,
  Shield,
  Leaf,
  HardHat,
  Theater,
  Monitor,
  Wheat,
  Scale,
  FileText,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

// Kategoria tematyczna ustawy
export type LegislativeCategory =
  | "finanse"
  | "zdrowie"
  | "edukacja"
  | "infrastruktura"
  | "bezpieczenstwo"
  | "srodowisko"
  | "praca"
  | "kultura"
  | "cyfryzacja"
  | "rolnictwo"
  | "sprawiedliwosc"
  | "inne"

// Pilność procesu
export type Urgency = "normal" | "pilny" | "ekspresowy"

// Impact analysis
export interface ImpactAnalysis {
  financial?: {
    budgetImpact: number // w mln PLN
    yearlyRecurring?: number
    description: string
  }
  social?: {
    affectedGroups: string[]
    positiveEffects: string[]
    negativeEffects: string[]
  }
  economic?: {
    sectors: string[]
    gdpImpact?: number // %
    employmentImpact?: number // liczba miejsc pracy
  }
  environmental?: {
    co2Impact?: number // tony
    description: string
  }
}

// Powiązana ustawa (nowelizacja, uchylenie itp.)
export interface RelatedLaw {
  id: string
  title: string
  relation: "nowelizuje" | "uchyla" | "implementuje" | "powiazana"
  dziennikUstaw?: string
}

// Komentarz/opinia
export interface PublicComment {
  id: string
  author: string
  authorType: "obywatel" | "organizacja" | "ekspert" | "ministerstwo"
  content: string
  sentiment: "pozytywny" | "neutralny" | "negatywny"
  date: string
  likes: number
}

// Alert/powiadomienie
export interface LegislativeAlert {
  id: string
  processId: string
  type: "etap" | "glosowanie" | "publikacja" | "termin"
  message: string
  date: string
  read: boolean
}

// Rozszerzona definicja procesu
export interface ExtendedLegislativeProcess extends LegislativeProcess {
  // Kategoryzacja
  categories: LegislativeCategory[]
  urgency: Urgency

  // Tłumaczenie na prosty język
  simpleSummary: string
  simpleExplanation: string
  keyChanges: string[]

  // Impact analysis
  impact?: ImpactAnalysis

  // Powiązania
  relatedLaws: RelatedLaw[]
  amendedBy?: string[] // ID ustaw nowelizujących

  // Statystyki
  viewCount: number
  watchCount: number
  commentCount: number

  // Komentarze
  comments?: PublicComment[]

  // Tagi
  tags: string[]

  // Estymacja
  estimatedCompletionDate?: string
  completionProbability?: number // 0-100%
}

// Status obserwowania
export interface WatchedProcess {
  processId: string
  userId: string
  addedAt: string
  alertOnStage: boolean
  alertOnVoting: boolean
  alertOnPublication: boolean
  notes?: string
}

// Filtr wyszukiwania
export interface LegislativeFilter {
  search?: string
  categories?: LegislativeCategory[]
  initiators?: InitiatorType[]
  status?: ("in-progress" | "completed" | "rejected")[]
  urgency?: Urgency[]
  dateFrom?: string
  dateTo?: string
  hasImpactAnalysis?: boolean
  watched?: boolean
}

// Statystyki
export interface LegislativeStats {
  totalProcesses: number
  inProgress: number
  completed: number
  rejected: number
  avgDuration: number // dni
  byInitiator: Record<InitiatorType, number>
  byCategory: Record<LegislativeCategory, number>
  recentActivity: {
    date: string
    count: number
  }[]
}

// Kategorie z etykietami i ikonami
export const CATEGORY_CONFIG: Record<LegislativeCategory, { label: string; icon: LucideIcon; color: string }> = {
  finanse: { label: "Finanse publiczne", icon: Coins, color: "#f59e0b" },
  zdrowie: { label: "Zdrowie", icon: HeartPulse, color: "#ef4444" },
  edukacja: { label: "Edukacja", icon: GraduationCap, color: "#8b5cf6" },
  infrastruktura: { label: "Infrastruktura", icon: Building2, color: "#6b7280" },
  bezpieczenstwo: { label: "Bezpieczeństwo", icon: Shield, color: "#1e3a8a" },
  srodowisko: { label: "Środowisko", icon: Leaf, color: "#22c55e" },
  praca: { label: "Praca i zabezpieczenie", icon: HardHat, color: "#f97316" },
  kultura: { label: "Kultura", icon: Theater, color: "#ec4899" },
  cyfryzacja: { label: "Cyfryzacja", icon: Monitor, color: "#0ea5e9" },
  rolnictwo: { label: "Rolnictwo", icon: Wheat, color: "#84cc16" },
  sprawiedliwosc: { label: "Sprawiedliwość", icon: Scale, color: "#7c3aed" },
  inne: { label: "Inne", icon: FileText, color: "#9ca3af" },
}

export const URGENCY_CONFIG: Record<Urgency, { label: string; color: string }> = {
  normal: { label: "Normalny", color: "#6b7280" },
  pilny: { label: "Pilny", color: "#f59e0b" },
  ekspresowy: { label: "Ekspresowy", color: "#ef4444" },
}

// Przykładowe rozszerzone procesy
export const EXTENDED_PROCESSES: ExtendedLegislativeProcess[] = [
  {
    id: "druk-764-2024",
    title: "Ustawa o zmianie ustawy o świadczeniach opieki zdrowotnej finansowanych ze środków publicznych",
    shortTitle: "Zmiana ustawy o świadczeniach zdrowotnych",
    documentNumber: "Druk nr 764",
    initiator: "government",
    initiatorName: "Rada Ministrów",
    processStatus: "completed",
    lastUpdated: "2024-12-19",
    sourceUrl: "https://www.sejm.gov.pl/sejm10.nsf/PrzebiegProc.xsp?id=C17D19F49487D6A8C1258BC700423461",
    categories: ["zdrowie", "finanse"],
    urgency: "pilny",
    simpleSummary: "Ustawa likwiduje obowiązek płacenia składki zdrowotnej od sprzedaży majątku firmy.",
    simpleExplanation:
      "Jeśli przedsiębiorca sprzeda np. samochód firmowy lub komputer, nie będzie musiał od tego płacić dodatkowej składki zdrowotnej. Do tej pory takie transakcje były obciążone składką, co było krytykowane przez przedsiębiorców jako niesprawiedliwe.",
    keyChanges: [
      "Zniesienie składki zdrowotnej od zbycia środków trwałych",
      "Uproszczenie rozliczeń dla przedsiębiorców",
      "Zmniejszenie obciążeń administracyjnych",
    ],
    impact: {
      financial: {
        budgetImpact: -120,
        yearlyRecurring: -120,
        description: "Zmniejszenie wpływów do NFZ o ok. 120 mln PLN rocznie",
      },
      social: {
        affectedGroups: ["Przedsiębiorcy", "Osoby prowadzące działalność gospodarczą"],
        positiveEffects: ["Mniejsze obciążenia dla firm", "Sprawiedliwsze zasady naliczania składek"],
        negativeEffects: ["Mniejsze wpływy do systemu zdrowotnego"],
      },
      economic: {
        sectors: ["Wszystkie sektory gospodarki"],
        employmentImpact: 0,
      },
    },
    relatedLaws: [
      {
        id: "dzu-2004-210-2135",
        title: "Ustawa o świadczeniach opieki zdrowotnej",
        relation: "nowelizuje",
        dziennikUstaw: "Dz.U. 2004 nr 210 poz. 2135",
      },
    ],
    viewCount: 15420,
    watchCount: 342,
    commentCount: 28,
    tags: ["składka zdrowotna", "przedsiębiorcy", "NFZ", "środki trwałe"],
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
        shape: "double-circle",
        institution: "publikacja",
        status: "completed",
        documentNumber: "Dz.U. poz. 1915",
      },
    ],
  },
  {
    id: "budget-2025",
    title: "Ustawa budżetowa na rok 2025",
    shortTitle: "Budżet 2025",
    documentNumber: "Druk nr 900",
    initiator: "government",
    initiatorName: "Rada Ministrów",
    processStatus: "in-progress",
    lastUpdated: "2024-12-01",
    categories: ["finanse"],
    urgency: "ekspresowy",
    simpleSummary: "Plan dochodów i wydatków państwa na 2025 rok.",
    simpleExplanation:
      "Ustawa budżetowa to najważniejszy dokument finansowy państwa. Określa ile pieniędzy państwo planuje zebrać (z podatków, opłat itp.) i na co je wyda (służba zdrowia, edukacja, wojsko, emerytury itd.). Budżet na 2025 rok przewiduje deficyt, czyli państwo wyda więcej niż zbierze.",
    keyChanges: [
      "Planowany deficyt: 289 mld PLN",
      "Wzrost wydatków na obronność do 4,7% PKB",
      "Podwyżki dla sfery budżetowej o 5%",
      "Nowe programy socjalne",
    ],
    impact: {
      financial: {
        budgetImpact: -289000,
        description: "Planowany deficyt budżetowy",
      },
      social: {
        affectedGroups: ["Wszyscy obywatele", "Pracownicy budżetówki", "Emeryci"],
        positiveEffects: ["Waloryzacja świadczeń", "Podwyżki w budżetówce"],
        negativeEffects: ["Rosnące zadłużenie państwa"],
      },
      economic: {
        sectors: ["Wszystkie"],
        gdpImpact: 3.5,
      },
    },
    relatedLaws: [],
    viewCount: 89420,
    watchCount: 1542,
    commentCount: 156,
    tags: ["budżet", "finanse publiczne", "deficyt", "2025"],
    estimatedCompletionDate: "2025-01-15",
    completionProbability: 95,
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
        dateEnd: "2024-12-15",
        shape: "rounded-rect",
        institution: "sejm",
        status: "current",
      },
      {
        id: "reading2-budget",
        name: "II Czytanie",
        shortName: "II Czytanie",
        description: "Drugie czytanie projektu budżetu",
        dateStart: "2024-12-16",
        dateEnd: "2024-12-16",
        shape: "rectangle",
        institution: "sejm",
        status: "future",
      },
      {
        id: "reading3-budget",
        name: "III Czytanie (głosowanie)",
        shortName: "III Czytanie",
        description: "Głosowanie nad ustawą budżetową",
        dateStart: "2024-12-20",
        dateEnd: "2024-12-20",
        shape: "diamond",
        institution: "sejm",
        status: "future",
        alternatives: [
          {
            id: "rejection-budget",
            name: "Odrzucenie budżetu",
            shortName: "Odrzucenie",
            description: "Odrzucenie projektu budżetu przez Sejm",
            dateStart: "2024-12-20",
            dateEnd: "2024-12-20",
            shape: "circle-x",
            institution: "sejm",
            status: "alternative",
          },
        ],
      },
      {
        id: "senate-budget",
        name: "Rozpatrzenie przez Senat",
        shortName: "Senat",
        description: "Senat ma 20 dni na rozpatrzenie ustawy budżetowej",
        dateStart: "2024-12-21",
        dateEnd: "2025-01-10",
        shape: "diamond",
        institution: "senat",
        status: "future",
        legalBasis: "Art. 223 Konstytucji RP",
      },
      {
        id: "president-budget",
        name: "Podpis Prezydenta",
        shortName: "Prezydent",
        description: "Prezydent ma 7 dni na podpisanie ustawy budżetowej",
        dateStart: "2025-01-11",
        dateEnd: "2025-01-18",
        shape: "diamond",
        institution: "prezydent",
        status: "future",
        legalBasis: "Art. 224 Konstytucji RP",
      },
      {
        id: "publication-budget",
        name: "Publikacja",
        shortName: "Publikacja",
        description: "Publikacja w Dzienniku Ustaw",
        dateStart: "2025-01-19",
        dateEnd: "2025-01-19",
        shape: "double-circle",
        institution: "publikacja",
        status: "future",
      },
    ],
  },
  {
    id: "citizen-housing-2024",
    title: "Obywatelski projekt ustawy o wsparciu budownictwa mieszkaniowego",
    shortTitle: "Ustawa mieszkaniowa (obywatelska)",
    documentNumber: "Druk nr 500",
    initiator: "citizens",
    initiatorName: 'Komitet Inicjatywy Ustawodawczej "Mieszkanie dla każdego"',
    processStatus: "in-progress",
    lastUpdated: "2024-11-15",
    categories: ["infrastruktura", "finanse"],
    urgency: "normal",
    simpleSummary: "Projekt zakłada dopłaty do kredytów mieszkaniowych dla młodych rodzin.",
    simpleExplanation:
      "Obywatele zebrali 150 tysięcy podpisów, żeby Sejm zajął się problemem drogich mieszkań. Projekt zakłada, że państwo będzie dopłacać do kredytów hipotecznych dla osób do 40 roku życia, które kupują swoje pierwsze mieszkanie. Dopłata ma wynosić 2% odsetek przez pierwsze 10 lat.",
    keyChanges: [
      "Dopłaty do kredytów hipotecznych 2% przez 10 lat",
      "Limit wieku: 40 lat",
      "Tylko pierwsze mieszkanie",
      "Limit wartości nieruchomości: 800 tys. PLN",
    ],
    impact: {
      financial: {
        budgetImpact: -5000,
        yearlyRecurring: -3000,
        description: "Szacowany koszt programu dopłat",
      },
      social: {
        affectedGroups: ["Młode rodziny", "Osoby do 40 roku życia", "Kupujący pierwsze mieszkanie"],
        positiveEffects: ["Łatwiejszy dostęp do mieszkań", "Wsparcie młodych rodzin"],
        negativeEffects: ["Możliwy wzrost cen nieruchomości"],
      },
      economic: {
        sectors: ["Budownictwo", "Bankowość"],
        employmentImpact: 15000,
      },
    },
    relatedLaws: [
      {
        id: "kredyt-2proc",
        title: "Ustawa o pomocy państwa w oszczędzaniu na cele mieszkaniowe",
        relation: "powiazana",
      },
    ],
    viewCount: 45200,
    watchCount: 2341,
    commentCount: 312,
    tags: ["mieszkania", "kredyty", "młode rodziny", "inicjatywa obywatelska"],
    estimatedCompletionDate: "2025-06-01",
    completionProbability: 35,
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
        dateEnd: "2025-02-15",
        shape: "rounded-rect",
        institution: "sejm",
        status: "current",
      },
      {
        id: "reading2-citizen",
        name: "II Czytanie",
        shortName: "II Czytanie",
        dateStart: "2025-03-01",
        dateEnd: "2025-03-01",
        shape: "rectangle",
        institution: "sejm",
        status: "future",
      },
      {
        id: "reading3-citizen",
        name: "III Czytanie",
        shortName: "III Czytanie",
        dateStart: "2025-03-15",
        dateEnd: "2025-03-15",
        shape: "diamond",
        institution: "sejm",
        status: "future",
        alternatives: [
          {
            id: "rejection-citizen",
            name: "Odrzucenie projektu",
            shortName: "Odrzucenie",
            dateStart: "2025-03-15",
            dateEnd: "2025-03-15",
            shape: "circle-x",
            institution: "sejm",
            status: "alternative",
          },
        ],
      },
      {
        id: "senate-citizen",
        name: "Głosowanie Senatu",
        shortName: "Senat",
        dateStart: "2025-03-16",
        dateEnd: "2025-04-15",
        shape: "diamond",
        institution: "senat",
        status: "future",
      },
      {
        id: "president-citizen",
        name: "Decyzja Prezydenta",
        shortName: "Prezydent",
        dateStart: "2025-04-16",
        dateEnd: "2025-05-07",
        shape: "diamond",
        institution: "prezydent",
        status: "future",
        alternatives: [
          {
            id: "veto-citizen",
            name: "Weto prezydenckie",
            shortName: "Weto",
            dateStart: "2025-04-16",
            dateEnd: "2025-05-07",
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
        dateStart: "2025-05-08",
        dateEnd: "2025-05-08",
        shape: "double-circle",
        institution: "publikacja",
        status: "future",
      },
    ],
  },
]

// Funkcje pomocnicze
export function getProcessProgress(process: ExtendedLegislativeProcess): number {
  const total = process.timeline.length
  const completed = process.timeline.filter((t) => t.status === "completed").length
  const current = process.timeline.find((t) => t.status === "current")
  return Math.round(((completed + (current ? 0.5 : 0)) / total) * 100)
}

export function getCurrentStage(process: ExtendedLegislativeProcess): TimelineNode | undefined {
  return process.timeline.find((t) => t.status === "current")
}

export function getNextStage(process: ExtendedLegislativeProcess): TimelineNode | undefined {
  const currentIndex = process.timeline.findIndex((t) => t.status === "current")
  if (currentIndex === -1) return undefined
  return process.timeline[currentIndex + 1]
}

export function getDaysRemaining(dateEnd: string): number {
  const end = new Date(dateEnd)
  const now = new Date()
  const diff = end.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}
