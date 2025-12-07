import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"
import { enrichProcesses } from "./enrichment/index"
import { CURRENT_TERM } from "./client"

dotenv.config()

// Konfiguracja Supabase
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function runEnrichment() {
  console.log("\n🤖 Starting AI Enrichment for 50 newest processes...\n")
  console.log("📊 This will:")
  console.log("  - Build timeline from stages")
  console.log("  - Classify categories & urgency")
  console.log("  - Generate AI summaries (if OPENAI_API_KEY is set)")
  console.log("\n" + "=".repeat(60) + "\n")

  const startTime = Date.now()

  try {
    await enrichProcesses(supabase, CURRENT_TERM)

    const duration = Math.round((Date.now() - startTime) / 1000)
    console.log("\n" + "=".repeat(60))
    console.log(`✅ Enrichment completed in ${duration}s`)
    console.log("=".repeat(60) + "\n")
  } catch (error) {
    console.error("\n❌ Enrichment failed:", error)
    process.exit(1)
  }
}

runEnrichment()
