export interface LegislativeStage {
  id: string
  name: string
  shortName: string
  description: string
  symbolType: "start" | "reading" | "work" | "decision" | "end-positive" | "end-negative" | "tribunal"
  symbolDescription: string
  branch: "main" | "senate" | "president" | "alternative"
  institution: "sejm" | "senat" | "prezydent" | "trybunal" | "publikacja"
  legalBasis: string
  duration?: string
  durationDays?: { min: number; max: number }
  isOptional?: boolean
  possibleOutcomes?: string[]
}

export interface Initiator {
  id: string
  name: string
  color: string
  description: string
}

export const initiators: Initiator[] = [
  {
    id: "president",
    name: "Prezydent RP",
    color: "#dc2626", // red-600
    description: "Inicjatywa prezydencka",
  },
  {
    id: "government",
    name: "Rada Ministrów",
    color: "#1e3a8a", // blue-800
    description: "Inicjatywa rządowa",
  },
  {
    id: "deputies",
    name: "Poselski",
    color: "#f97316", // orange-500
    description: "Min. 15 posłów lub komisja sejmowa",
  },
  {
    id: "senate",
    name: "Senat",
    color: "#9333ea", // purple-600
    description: "Inicjatywa senacka",
  },
  {
    id: "citizens",
    name: "Obywatelski",
    color: "#16a34a", // green-600
    description: "Min. 100 000 obywateli",
  },
]

export const legislativeStages: LegislativeStage[] = [
  // Main Sejm path
  {
    id: "initiative",
    name: "Inicjatywa ustawodawcza",
    shortName: "Inicjatywa",
    description: "Złożenie projektu ustawy przez uprawniony podmiot (Prezydent, Rząd, Senat, posłowie lub obywatele).",
    symbolType: "start",
    symbolDescription: "Pusty okrąg — początek procesu",
    branch: "main",
    institution: "sejm",
    legalBasis: "Art. 118 Konstytucji RP",
    durationDays: { min: 1, max: 7 },
    possibleOutcomes: ["Projekt przyjęty do prac", "Projekt zwrócony do poprawy"],
  },
  {
    id: "first-reading",
    name: "I Czytanie",
    shortName: "I Czytanie",
    description:
      "Pierwsze czytanie projektu ustawy. Odbywa się w komisji sejmowej lub na posiedzeniu plenarnym (dla ustaw o zmianie Konstytucji, budżetowych, podatkowych, kodeksów).",
    symbolType: "reading",
    symbolDescription: "Prostokąt z grubą ramką — czytanie w Sejmie",
    branch: "main",
    institution: "sejm",
    legalBasis: "Art. 119 Konstytucji RP, art. 32-70 Regulaminu Sejmu",
    duration: "1-4 tygodnie",
    durationDays: { min: 7, max: 28 },
    possibleOutcomes: ["Skierowanie do komisji", "Odrzucenie projektu"],
  },
  {
    id: "committee-work",
    name: "Prace komisji sejmowej",
    shortName: "Komisja",
    description:
      "Szczegółowa analiza projektu przez właściwą komisję sejmową. Możliwość wprowadzania poprawek, udział ekspertów, opracowanie sprawozdania.",
    symbolType: "work",
    symbolDescription: "Zaokrąglony prostokąt — prace/analiza",
    branch: "main",
    institution: "sejm",
    legalBasis: "Regulamin Sejmu",
    duration: "2-8 tygodni",
    durationDays: { min: 14, max: 56 },
    possibleOutcomes: ["Sprawozdanie pozytywne", "Sprawozdanie negatywne", "Propozycja poprawek"],
  },
  {
    id: "second-reading",
    name: "II Czytanie",
    shortName: "II Czytanie",
    description:
      "Drugie czytanie na posiedzeniu plenarnym Sejmu. Przedstawienie sprawozdania komisji, debata, zgłaszanie poprawek.",
    symbolType: "reading",
    symbolDescription: "Prostokąt z grubą ramką — czytanie w Sejmie",
    branch: "main",
    institution: "sejm",
    legalBasis: "Art. 119 Konstytucji RP",
    duration: "1-2 dni",
    durationDays: { min: 1, max: 2 },
    possibleOutcomes: ["Przejście do III czytania", "Ponowne skierowanie do komisji"],
  },
  {
    id: "third-reading",
    name: "III Czytanie (głosowanie)",
    shortName: "III Czytanie",
    description:
      "Trzecie czytanie — głosowanie nad projektem. Sejm uchwala ustawy zwykłą większością głosów w obecności co najmniej połowy ustawowej liczby posłów.",
    symbolType: "decision",
    symbolDescription: "Romb — decyzja/głosowanie",
    branch: "main",
    institution: "sejm",
    legalBasis: "Art. 120 Konstytucji RP",
    duration: "1 dzień",
    durationDays: { min: 1, max: 1 },
    possibleOutcomes: ["Uchwalenie ustawy", "Odrzucenie projektu"],
  },
  // Senate branch
  {
    id: "senate-committee",
    name: "Komisja senacka",
    shortName: "Komisja Sen.",
    description:
      "Marszałek Senatu kieruje ustawę do właściwej komisji senackiej, która w terminie do 18 dni opracowuje stanowisko.",
    symbolType: "work",
    symbolDescription: "Zaokrąglony prostokąt — prace/analiza",
    branch: "senate",
    institution: "senat",
    legalBasis: "Art. 121 Konstytucji RP, art. 68-72 Regulaminu Senatu",
    duration: "do 18 dni",
    durationDays: { min: 7, max: 18 },
  },
  {
    id: "senate-vote",
    name: "Głosowanie Senatu",
    shortName: "Głos. Senatu",
    description:
      "Senat ma 30 dni na podjęcie uchwały. Może przyjąć ustawę bez zmian, wprowadzić poprawki lub odrzucić w całości (weto senackie).",
    symbolType: "decision",
    symbolDescription: "Romb — decyzja/głosowanie",
    branch: "senate",
    institution: "senat",
    legalBasis: "Art. 121 Konstytucji RP",
    duration: "do 30 dni łącznie",
    durationDays: { min: 1, max: 12 },
    possibleOutcomes: ["Przyjęcie bez zmian → Prezydent", "Wprowadzenie poprawek → Sejm", "Odrzucenie (weto) → Sejm"],
  },
  {
    id: "sejm-senate-response",
    name: "Odpowiedź Sejmu na stanowisko Senatu",
    shortName: "Odp. Sejmu",
    description:
      "Sejm może bezwzględną większością głosów odrzucić uchwałę Senatu (poprawki lub weto). Jeśli nie odrzuci — stanowisko Senatu zostaje przyjęte.",
    symbolType: "decision",
    symbolDescription: "Romb — decyzja/głosowanie",
    branch: "senate",
    institution: "sejm",
    legalBasis: "Art. 121 ust. 3 Konstytucji RP",
    isOptional: true,
    durationDays: { min: 1, max: 14 },
    possibleOutcomes: ["Odrzucenie stanowiska Senatu", "Przyjęcie stanowiska Senatu"],
  },
  // President branch
  {
    id: "president-decision",
    name: "Decyzja Prezydenta",
    shortName: "Decyzja Prez.",
    description:
      "Prezydent ma 21 dni na podpisanie ustawy. Może podpisać, zawetować lub skierować do Trybunału Konstytucyjnego.",
    symbolType: "decision",
    symbolDescription: "Romb — decyzja/głosowanie",
    branch: "president",
    institution: "prezydent",
    legalBasis: "Art. 122 Konstytucji RP",
    duration: "do 21 dni",
    durationDays: { min: 1, max: 21 },
    possibleOutcomes: ["Podpisanie → publikacja", "Weto → Sejm", "Skierowanie do TK"],
  },
  {
    id: "tribunal",
    name: "Trybunał Konstytucyjny",
    shortName: "TK",
    description:
      "Prezydent może zwrócić się do TK o zbadanie zgodności ustawy z Konstytucją. TK orzeka o zgodności lub niezgodności.",
    symbolType: "tribunal",
    symbolDescription: "Prostokąt przerywany z TK — kontrola konstytucyjności",
    branch: "president",
    institution: "trybunal",
    legalBasis: "Art. 122 ust. 3 Konstytucji RP",
    isOptional: true,
    durationDays: { min: 30, max: 180 },
    possibleOutcomes: [
      "Zgodna z Konstytucją → podpis",
      "Niezgodna w całości → odrzucenie",
      "Częściowo niezgodna → podpis z pominięciem lub zwrot do Sejmu",
    ],
  },
  {
    id: "veto-vote",
    name: "Głosowanie nad wetem",
    shortName: "Głos. nad wetem",
    description:
      "Sejm może odrzucić weto prezydenckie kwalifikowaną większością 3/5 głosów. Jest to bardzo trudne do osiągnięcia.",
    symbolType: "decision",
    symbolDescription: "Romb — decyzja/głosowanie",
    branch: "president",
    institution: "sejm",
    legalBasis: "Art. 122 ust. 5 Konstytucji RP",
    isOptional: true,
    durationDays: { min: 1, max: 30 },
    possibleOutcomes: ["Odrzucenie weta (3/5) → podpis obowiązkowy", "Nieodrzucenie weta → koniec procesu"],
  },
  // Alternative endings
  {
    id: "publication",
    name: "Publikacja w Dzienniku Ustaw",
    shortName: "Publikacja",
    description:
      "Prezydent zarządza publikację ustawy w Dzienniku Ustaw. Ustawa wchodzi w życie po upływie vacatio legis (standardowo 14 dni).",
    symbolType: "end-positive",
    symbolDescription: "Podwójny okrąg — zakończenie pozytywne",
    branch: "alternative",
    institution: "publikacja",
    legalBasis: "Ustawa o ogłaszaniu aktów normatywnych",
    durationDays: { min: 14, max: 14 },
    possibleOutcomes: ["Ustawa wchodzi w życie"],
  },
  {
    id: "rejection",
    name: "Odrzucenie projektu",
    shortName: "Odrzucenie",
    description: "Projekt ustawy zostaje odrzucony na którymkolwiek etapie procesu legislacyjnego. Koniec procesu.",
    symbolType: "end-negative",
    symbolDescription: "Okrąg z X — zakończenie negatywne",
    branch: "alternative",
    institution: "sejm",
    legalBasis: "Różne podstawy w zależności od etapu",
    durationDays: { min: 1, max: 1 },
    possibleOutcomes: ["Koniec procesu legislacyjnego"],
  },
]

export const institutionColors: Record<string, { bg: string; border: string; text: string; label: string }> = {
  sejm: { bg: "#ef4444", border: "#dc2626", text: "#ffffff", label: "Sejm" },
  senat: { bg: "#3b82f6", border: "#2563eb", text: "#ffffff", label: "Senat" },
  prezydent: { bg: "#8b5cf6", border: "#7c3aed", text: "#ffffff", label: "Prezydent" },
  trybunal: { bg: "#f59e0b", border: "#d97706", text: "#000000", label: "Trybunał Konstytucyjny" },
  publikacja: { bg: "#22c55e", border: "#16a34a", text: "#ffffff", label: "Publikacja" },
}

export function getInitiatorColor(initiatorId: string): string {
  return initiators.find((i) => i.id === initiatorId)?.color ?? "#6b7280"
}

export function getInitiatorName(initiatorId: string): string {
  return initiators.find((i) => i.id === initiatorId)?.name ?? "Nieznany"
}
