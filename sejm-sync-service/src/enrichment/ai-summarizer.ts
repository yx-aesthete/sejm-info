import OpenAI from "openai"
import type { TimelineNode } from "../types"

let openaiClient: OpenAI | null = null

function getOpenAI(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) {
    console.warn("[AI] OPENAI_API_KEY not set, skipping AI enrichment")
    return null
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  }

  return openaiClient
}

export interface AIEnrichment {
  simpleSummary?: string
  simpleExplanation?: string
  keyChanges?: string[]
  tags?: string[]
  impact?: {
    financial?: {
      budgetImpact?: number
      yearlyRecurring?: number
      description?: string
    }
    social?: {
      affectedGroups?: string[]
      positiveEffects?: string[]
      negativeEffects?: string[]
    }
    economic?: {
      sectors?: string[]
      gdpImpact?: number
      employmentImpact?: number
    }
    environmental?: {
      co2Impact?: number
      description?: string
    }
  }
  relatedLaws?: Array<{
    title: string
    relation: string
    dziennikUstaw?: string
  }>
  initiatorName?: string
}

export async function generateAISummary(
  title: string,
  description: string | undefined,
  timeline: TimelineNode[],
  projectType?: string,
  documentType?: string,
  pdfContent?: string
): Promise<AIEnrichment> {
  const openai = getOpenAI()
  if (!openai) {
    return {}
  }

  try {
    // Prepare detailed timeline with voting results and document numbers
    const timelineSummary = timeline
      .map((node, index) => {
        let line = `${index + 1}. ${node.name}`
        line += ` (${node.dateStart}${node.dateEnd !== node.dateStart ? ` - ${node.dateEnd}` : ""})`

        if (node.documentNumber) {
          line += ` [${node.documentNumber}]`
        }

        if (node.votingResult) {
          const { for: yes, against: no, abstained } = node.votingResult
          line += ` → Głosowanie: ${yes} za, ${no} przeciw, ${abstained} wstrzymało się`
        }

        if (node.description) {
          line += `\n   Szczegóły: ${node.description}`
        }

        return line
      })
      .join("\n")

    const prompt = `Jesteś ekspertem ds. polskiego procesu legislacyjnego i analityki prawnej. Przeanalizuj poniższy projekt ustawy i wygeneruj PEŁNĄ analizę:

**WYMAGANE SEKCJE:**

1. **simpleSummary** (1-2 zdania) - Co ustawa zmienia w prostych słowach
2. **simpleExplanation** (3-4 zdania) - Co to oznacza dla obywateli i dlaczego jest ważne
3. **keyChanges** (lista 3-5 punktów) - Najważniejsze zmiany wprowadzane przez ustawę
4. **tags** (lista 3-5 słów kluczowych)
5. **initiatorName** (string) - Nazwa inicjatora projektu (np. "Rada Ministrów", "Grupa posłów PO")
6. **impact** (obiekt) - Szczegółowa analiza wpływu:
   - **financial**: budgetImpact (liczba w mln PLN), yearlyRecurring (jeśli dotyczy), description
   - **social**: affectedGroups (tablica), positiveEffects (tablica), negativeEffects (tablica)
   - **economic**: sectors (tablica), gdpImpact (% jako liczba), employmentImpact (liczba miejsc pracy)
   - **environmental**: co2Impact (tony jako liczba), description (jeśli dotyczy)
7. **relatedLaws** (tablica) - Powiązane ustawy: [{title, relation ("nowelizuje"|"uchyla"|"implementuje"|"powiązana"), dziennikUstaw?}]

**DANE DO ANALIZY:**

**Tytuł:** ${title}
${documentType ? `**Typ dokumentu:** ${documentType}\n` : ""}${projectType ? `**Typ projektu:** ${projectType}\n` : ""}
${description ? `**Opis z API:** ${description}\n\n` : ""}${pdfContent ? `**TREŚĆ DOKUMENTU (PDF):**\n${pdfContent}\n\n` : ""}**Przebieg procesu:**
${timelineSummary || "Brak danych"}

**INSTRUKCJE:**
- ${pdfContent ? "WYKORZYSTAJ treść PDF do szczegółowej analizy" : "Analizuj tylko na podstawie dostępnych metadanych"}
- Oblicz konkretne liczby dla impact (budżet, PKB, miejsca pracy) na podstawie treści
- Wymień WSZYSTKIE grupy społeczne, które dotknie ustawa
- Jeśli nie masz danych na jakieś pole, pomiń je (nie wymyślaj)
- Używaj prostego języka, konkretów, liczb
- Jeśli proces odrzucony/wycofany, zaznacz to w summary

Zwróć JSON:
{
  "simpleSummary": "...",
  "simpleExplanation": "...",
  "keyChanges": ["...", "...", "..."],
  "tags": ["...", "...", "..."],
  "initiatorName": "...",
  "impact": {
    "financial": { "budgetImpact": 0, "description": "..." },
    "social": { "affectedGroups": ["..."], "positiveEffects": ["..."], "negativeEffects": ["..."] },
    "economic": { "sectors": ["..."] },
    "environmental": { "description": "..." }
  },
  "relatedLaws": [{ "title": "...", "relation": "nowelizuje", "dziennikUstaw": "..." }]
}`

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Jesteś asystentem pomagającym obywatelom zrozumieć procesy legislacyjne. Twoim zadaniem jest tłumaczenie języka prawniczego na prosty, zrozumiały język."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      console.warn("[AI] Empty response from OpenAI")
      return {}
    }

    const parsed = JSON.parse(content) as AIEnrichment

    return {
      simpleSummary: parsed.simpleSummary,
      simpleExplanation: parsed.simpleExplanation,
      keyChanges: parsed.keyChanges,
      tags: parsed.tags,
      impact: parsed.impact,
      relatedLaws: parsed.relatedLaws,
      initiatorName: parsed.initiatorName
    }

  } catch (error) {
    console.error("[AI] Error generating summary:", error)
    return {}
  }
}

export async function batchGenerateSummaries(
  processes: Array<{
    id: string
    title: string
    description?: string
    timeline: TimelineNode[]
  }>,
  onProgress?: (current: number, total: number) => void
): Promise<Map<string, AIEnrichment>> {
  const results = new Map<string, AIEnrichment>()
  const openai = getOpenAI()

  if (!openai) {
    console.warn("[AI] Skipping batch AI enrichment - no API key")
    return results
  }

  for (let i = 0; i < processes.length; i++) {
    const proc = processes[i]

    if (onProgress) {
      onProgress(i + 1, processes.length)
    }

    const enrichment = await generateAISummary(
      proc.title,
      proc.description,
      proc.timeline
    )

    if (enrichment.simpleSummary || enrichment.tags) {
      results.set(proc.id, enrichment)
    }

    // Rate limiting: wait 1 second between requests
    if (i < processes.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  return results
}
