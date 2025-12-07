import { NextRequest, NextResponse } from "next/server"
import { fullSync, quickSync, type SyncResult } from "@/lib/sejm-api/sync"
import { createClient } from "@supabase/supabase-js"

const CRON_SECRET = process.env.CRON_SECRET

// Weryfikacja autoryzacji cron job
function verifyCronAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization")

  // Vercel Cron używa CRON_SECRET
  if (CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`) {
    return true
  }

  // Dla development - pozwól na manualne wywołanie
  if (process.env.NODE_ENV === "development") {
    return true
  }

  return false
}

// Logowanie synchronizacji do bazy
async function logSync(type: string, results: SyncResult[], status: "success" | "error", errorMessage?: string) {
  try {
    const url = process.env.NEXT_PUBLIC_SEJMSUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !serviceKey) return

    const supabase = createClient(url, serviceKey)

    const totalProcessed = results.reduce((sum, r) => sum + r.processed, 0)
    const totalCreated = results.reduce((sum, r) => sum + r.created, 0)
    const totalUpdated = results.reduce((sum, r) => sum + r.updated, 0)

    await supabase.from("sync_logs").insert({
      sync_type: type,
      term_number: 10,
      status,
      items_processed: totalProcessed,
      items_created: totalCreated,
      items_updated: totalUpdated,
      error_message: errorMessage,
      finished_at: new Date().toISOString(),
      metadata: { results },
    })
  } catch (error) {
    console.error("[SyncLog] Failed to log:", error)
  }
}

export async function GET(request: NextRequest) {
  // Weryfikuj autoryzację
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const mode = searchParams.get("mode") || "quick" // 'quick' lub 'full'
  const term = Number.parseInt(searchParams.get("term") || "10")

  console.log(`[SejmSync] Starting ${mode} sync for term ${term}`)

  try {
    const startTime = Date.now()

    let results: SyncResult[]
    if (mode === "full") {
      results = await fullSync(term)
    } else {
      results = await quickSync(term)
    }

    const duration = Date.now() - startTime
    const hasErrors = results.some((r) => !r.success || r.errors.length > 0)

    // Loguj do bazy
    await logSync(
      mode,
      results,
      hasErrors ? "error" : "success",
      hasErrors ? results.flatMap((r) => r.errors).join("; ") : undefined,
    )

    console.log(`[SejmSync] Completed in ${duration}ms`, results)

    return NextResponse.json({
      success: !hasErrors,
      mode,
      term,
      duration,
      results: results.map((r) => ({
        type: r.type,
        processed: r.processed,
        created: r.created,
        updated: r.updated,
        errors: r.errors.length,
        duration: r.duration,
      })),
    })
  } catch (error) {
    console.error("[SejmSync] Failed:", error)

    await logSync("error", [], "error", String(error))

    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 },
    )
  }
}

// POST dla manualnego triggera z dashboardu
export async function POST(request: NextRequest) {
  // Weryfikuj autoryzację (tu możemy dodać auth użytkownika admin)
  const body = await request.json().catch(() => ({}))
  const { mode = "quick", term = 10 } = body

  // Przekieruj do GET z parametrami
  const url = new URL(request.url)
  url.searchParams.set("mode", mode)
  url.searchParams.set("term", String(term))

  return GET(
    new NextRequest(url, {
      headers: request.headers,
    }),
  )
}
