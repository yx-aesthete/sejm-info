import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"
import cron from "node-cron"
import { 
  syncClubs, 
  syncMPs, 
  syncCommittees, 
  syncPrints, 
  syncProcesses, 
  syncVotings,
  type SyncResult 
} from "./sync"
import { enrichProcesses } from "./enrichment/index"
import { CURRENT_TERM } from "./client"

dotenv.config()

// Konfiguracja Supabase
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function runFullSync(term = CURRENT_TERM) {
  console.log(`[${new Date().toISOString()}] Starting full sync for term ${term}...`)
  const startTime = Date.now()
  
  const results: SyncResult[] = []

  try {
    // 1. Słowniki i podmioty (brak zależności)
    console.log("Syncing Clubs...")
    results.push(await syncClubs(supabase, term))
    
    console.log("Syncing MPs...")
    results.push(await syncMPs(supabase, term))
    
    console.log("Syncing Committees...")
    results.push(await syncCommittees(supabase, term))

    // 2. Dokumenty i Procesy
    console.log("Syncing Prints...")
    results.push(await syncPrints(supabase, term))
    
    console.log("Syncing Processes...")
    results.push(await syncProcesses(supabase, term))

    // 3. Głosowania (zależą od posiedzeń i procesów)
    console.log("Syncing Votings...")
    results.push(await syncVotings(supabase, term))

    // 4. Enrichment (Analiza danych i AI)
    console.log("Enriching Processes...")
    await enrichProcesses(supabase, term)

    // Logowanie wyników do bazy (opcjonalne)
    await logSyncResults(results)

  } catch (error) {
    console.error("Critical sync error:", error)
  }

  const duration = Date.now() - startTime
  console.log(`[${new Date().toISOString()}] Full sync finished in ${duration}ms`)
  console.table(results.map(r => ({ 
    type: r.type, 
    success: r.success, 
    processed: r.processed, 
    created: r.created, 
    errors: r.errors.length 
  })))
}

async function logSyncResults(results: SyncResult[]) {
  const totalProcessed = results.reduce((sum, r) => sum + r.processed, 0)
  const totalCreated = results.reduce((sum, r) => sum + r.created, 0)
  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0)
  const hasErrors = results.some(r => !r.success || r.errors.length > 0)

  try {
    await supabase.from("sync_logs").insert({
      sync_type: "full_auto",
      term_number: CURRENT_TERM,
      status: hasErrors ? "error" : "success",
      items_processed: totalProcessed,
      items_created: totalCreated,
      error_message: hasErrors ? "Some steps failed or had errors" : null,
      metadata: { details: results },
      finished_at: new Date().toISOString()
    })
  } catch (err) {
    console.error("Failed to log sync results to DB:", err)
  }
}

// Harmonogram: co 6 godzin (0 */6 * * *)
cron.schedule("0 */6 * * *", async () => {
  await runFullSync()
})

// Manual start on launch
console.log("Sejm Sync Service started. Scheduled for every 6 hours.")
runFullSync().catch(console.error)
