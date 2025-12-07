import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"
import { fetchWithRetry, SEJM_API_BASE } from "./client"

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing credentials for test")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  console.log("Testing Supabase connection...")
  const { data, error } = await supabase.from("terms").select("count").single()
  if (error) {
    console.error("Supabase connection failed:", error.message)
  } else {
    console.log("Supabase connection successful. Terms count:", data)
  }
}

async function testSejmApi() {
  console.log("Testing Sejm API connection...")
  const term = 10
  const info = await fetchWithRetry<any>(`${SEJM_API_BASE}/term${term}/info`)
  if (info) {
    console.log("Sejm API connection successful. Term info:", info)
  } else {
    console.error("Sejm API connection failed")
  }
}

async function runTests() {
  await testConnection()
  await testSejmApi()
}

runTests().catch(console.error)

