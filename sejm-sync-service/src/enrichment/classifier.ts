import type { LegislativeCategory, Urgency } from "../types"

const CATEGORY_KEYWORDS: Record<LegislativeCategory, string[]> = {
  finanse: ["finans", "budżet", "podat", "vat", "pit", "cit", "akcyz", "bank", "pieniądz", "skarbow"],
  zdrowie: ["zdrow", "lekar", "szpital", "pacjent", "lek ", "leków", "medycz", "sanitarn", "nfz"],
  edukacja: ["edukac", "szkoł", "szkoln", "uczen", "nauczyc", "oświat", "uczelni", "student"],
  infrastruktura: ["infrastrukt", "drog", "kolej", "transport", "budow", "mieszkan", "lokal", "przestrzen"],
  bezpieczenstwo: ["bezpieczeństw", "obron", "wojsk", "policj", "straż", "służb", "granic", "armia"],
  srodowisko: ["środowisk", "klimat", "wodn", "lasy", "zwierzę", "ekolog", "odpad", "powietrz"],
  praca: ["prac", "zatrudni", "wynagrodz", "płac", "urlop", "zasiłek", "emeryt", "rent", "społecz", "zus"],
  kultura: ["kultur", "sztuk", "artyst", "muze", "teatr", "dziedzictw", "media", "radio", "telewizj"],
  cyfryzacja: ["cyfryz", "cyfrow", "internet", "komputer", "informaryz", "dane", "sieć"],
  rolnictwo: ["rolni", "wieś", "wiejsk", "upraw", "hodowl", "ziemi"],
  sprawiedliwosc: ["sąd", "praw", "karn", "cywil", "prokuratur", "więzien", "kodeks", "ustrój"],
  inne: []
}

export function classifyProcess(title: string, description?: string): LegislativeCategory[] {
  const text = (title + " " + (description || "")).toLowerCase()
  const categories: LegislativeCategory[] = []

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => text.includes(kw))) {
      categories.push(category as LegislativeCategory)
    }
  }

  if (categories.length === 0) {
    categories.push("inne")
  }

  return categories
}

export function detectUrgency(title: string, description?: string): Urgency {
  const text = (title + " " + (description || "")).toLowerCase()
  
  if (text.includes("pilny") || text.includes("tryb pilny")) {
    return "pilny"
  }
  
  return "normal"
}
