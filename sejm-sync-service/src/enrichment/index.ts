import { SupabaseClient } from "@supabase/supabase-js"
import { buildTimeline } from "./timeline"
import { classifyProcess, detectUrgency } from "./classifier"
import { generateAISummary } from "./ai-summarizer"
import { getProcessPrintContent } from "./pdf-extractor"
import type { DbProcessStage, DbVoting, DbPrint } from "../types"

export async function enrichProcesses(supabase: SupabaseClient, term: number) {
  console.log(`[Enrichment] Starting for term ${term}...`)
  const startTime = Date.now()
  let processedCount = 0
  let errorsCount = 0

  try {
    // 1. Fetch processes - LIMIT to 50 newest for AI to save tokens
    const { data: processes, error: procError } = await supabase
      .from("legislative_processes")
      .select("id, term_number, number, title, description, is_finished, is_rejected, project_type, document_type, change_date")
      .eq("term_number", term)
      .order("change_date", { ascending: false })
      .limit(50)

    if (procError || !processes) {
      throw new Error(`Failed to fetch processes: ${procError?.message}`)
    }

    console.log(`[Enrichment] Found ${processes.length} processes to enrich.`)

    // Fetch all prints once (for mapping)
    const { data: prints } = await supabase
      .from("prints")
      .select("number, title, process_print, attachments")
      .eq("term_number", term)

    // Process in chunks
    const CHUNK_SIZE = 50
    for (let i = 0; i < processes.length; i += CHUNK_SIZE) {
      const chunk = processes.slice(i, i + CHUNK_SIZE)
      const processIds = chunk.map(p => p.id)
      
      // Log progress
      console.log(`[Enrichment] Processing ${i + 1}-${Math.min(i + CHUNK_SIZE, processes.length)}/${processes.length}...`)
      
      // Fetch stages for this chunk
      const { data: stages } = await supabase
        .from("process_stages")
        .select("*")
        .in("process_id", processIds)
        .order("stage_number")
        
      // Fetch votings for this chunk
      const { data: votings } = await supabase
        .from("votings")
        .select("*")
        .in("process_id", processIds)

      for (const proc of chunk) {
        try {
          const procStages = (stages?.filter(s => s.process_id === proc.id) || []) as DbProcessStage[]
          const procVotings = (votings?.filter(v => v.process_id === proc.id) || []) as DbVoting[]
          
          // 1. Build Timeline
          const timeline = buildTimeline({
            stages: procStages,
            votings: procVotings,
            prints: (prints || []) as DbPrint[],
            isFinished: proc.is_finished,
            isRejected: proc.is_rejected
          })

          // 2. Classify
          const categories = classifyProcess(proc.title, proc.description)
          const urgency = detectUrgency(proc.title, proc.description)

          // 3. Extract PDF content (if available)
          console.log(`[Enrichment] ${proc.number}: Checking for PDF...`)
          const pdfContent = await getProcessPrintContent(prints || [], proc.number, term)
          const pdfText = pdfContent?.text

          if (pdfText) {
            console.log(`[Enrichment] ${proc.number}: PDF extracted (${pdfText.length} chars, ${pdfContent.pages} pages)`)
          }

          // 4. Generate AI summary (if API key is set) - with ALL available data including PDF
          console.log(`[Enrichment] ${proc.number}: Generating AI summary...`)
          const aiEnrichment = await generateAISummary(
            proc.title,
            proc.description,
            timeline,
            proc.project_type,
            proc.document_type,
            pdfText
          )

          // 5. Update DB with FULL enrichment data
          const extendedData = {
            analyzed_at: new Date().toISOString(),
            simpleSummary: aiEnrichment.simpleSummary,
            simpleExplanation: aiEnrichment.simpleExplanation,
            keyChanges: aiEnrichment.keyChanges,
            tags: aiEnrichment.tags,
            initiatorName: aiEnrichment.initiatorName,
            impact: aiEnrichment.impact,
            relatedLaws: aiEnrichment.relatedLaws,
            pdfAnalyzed: !!pdfText,
            pdfPages: pdfContent?.pages,
          }

          await supabase.from("legislative_processes").update({
            timeline: timeline,
            categories: categories,
            urgency: urgency,
            extended_data: extendedData
          }).eq("id", proc.id)

          processedCount++
        } catch (err) {
          console.error(`[Enrichment] Error processing ${proc.id}:`, err)
          errorsCount++
        }
      }
    }

  } catch (error) {
    console.error("[Enrichment] Critical error:", error)
  }

  const duration = Date.now() - startTime
  console.log(`[Enrichment] Finished in ${duration}ms. Processed: ${processedCount}, Errors: ${errorsCount}`)
}
