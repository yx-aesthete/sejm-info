import { createServerSupabaseClient } from "@/lib/supabase/server"
import type { TimelineNode, InitiatorType } from "@/lib/legislative-schema"
import type { ExtendedLegislativeProcess, LegislativeCategory, Urgency } from "@/lib/legislative-extended-schema"

// Database types
export interface DbProcess {
  id: string
  term_number: number
  number: string
  title: string
  description?: string
  document_type?: string
  project_type: string
  current_stage?: string
  is_finished: boolean
  is_rejected: boolean
  document_date?: string
  change_date?: string
  created_at: string
  updated_at: string
  timeline?: TimelineNode[]
  categories?: string[]
  urgency?: string
  extended_data?: any
}

// Mapper from DB to Extended Process
export function mapDbToExtended(process: DbProcess): ExtendedLegislativeProcess {
  const timeline: TimelineNode[] = process.timeline || []
  
  let initiator: InitiatorType = "other"
  if (process.project_type === "government") initiator = "government"
  else if (process.project_type === "senate") initiator = "senate"
  else if (process.project_type === "president") initiator = "president"
  else if (process.project_type === "citizens") initiator = "citizens"
  else if (process.project_type === "deputies") initiator = "deputies"
  else if (process.project_type === "committee") initiator = "committee"

  const categories: LegislativeCategory[] = (process.categories as LegislativeCategory[]) || ["inne"]
  const urgency: Urgency = (process.urgency as Urgency) || "normal"
  const extended = process.extended_data || {}

  return {
    id: process.id,
    title: process.title,
    shortTitle: process.title.length > 80 ? process.title.substring(0, 80) + "..." : process.title,
    documentNumber: `Druk nr ${process.number}`,
    initiator,
    initiatorName: extended.initiatorName || "Inicjator",
    processStatus: process.is_rejected ? "rejected" : process.is_finished ? "completed" : "in-progress",
    timeline,
    lastUpdated: process.change_date || process.updated_at,
    sourceUrl: `https://www.sejm.gov.pl/sejm10.nsf/PrzebiegProc.xsp?id=${process.number}`,
    categories,
    urgency,
    simpleSummary: extended.simpleSummary || process.description || process.title,
    simpleExplanation: extended.simpleExplanation || null,
    keyChanges: extended.keyChanges || [],
    relatedLaws: extended.relatedLaws || [],
    viewCount: 0,
    watchCount: 0,
    commentCount: 0,
    tags: extended.tags || [],
    impact: extended.impact,
  }
}

// Get single process by ID or number
export async function getProcessById(idOrNumber: string): Promise<ExtendedLegislativeProcess | null> {
  try {
    const supabase = await createServerSupabaseClient()

    const isUUID = idOrNumber.includes("-") && idOrNumber.length > 30

    let query = supabase.from("legislative_processes").select("*")

    if (isUUID) {
      query = query.eq("id", idOrNumber)
    } else {
      query = query.eq("number", idOrNumber).eq("term_number", 10)
    }

    const { data, error } = await query.single()

    if (error || !data) {
      console.error("[ProcessService] getProcessById error:", error)
      return null
    }

    return mapDbToExtended(data)
  } catch (error) {
    console.error("[ProcessService] getProcessById error:", error)
    return null
  }
}

// Get list of processes with filters
export interface ProcessFilters {
  search?: string
  status?: "all" | "active" | "finished" | "rejected"
  projectType?: string
  limit?: number
  offset?: number
}

export async function getProcesses(filters: ProcessFilters = {}): Promise<{ data: ExtendedLegislativeProcess[]; count: number }> {
  try {
    const supabase = await createServerSupabaseClient()
    const { search, status, projectType, limit = 50, offset = 0 } = filters

    let query = supabase
      .from("legislative_processes")
      .select("*", { count: "exact" })
      .order("change_date", { ascending: false })

    if (status === "active") {
      query = query.eq("is_finished", false).eq("is_rejected", false)
    } else if (status === "finished") {
      query = query.eq("is_finished", true)
    } else if (status === "rejected") {
      query = query.eq("is_rejected", true)
    }

    if (projectType && projectType !== "all") {
      query = query.eq("project_type", projectType)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,number.ilike.%${search}%`)
    }

    query = query.range(offset, offset + limit - 1)

    const { data, count, error } = await query

    if (error) {
      console.error("[ProcessService] getProcesses error:", error)
      return { data: [], count: 0 }
    }

    return {
      data: (data || []).map(mapDbToExtended),
      count: count || 0,
    }
  } catch (error) {
    console.error("[ProcessService] getProcesses error:", error)
    return { data: [], count: 0 }
  }
}

// Get statistics (global - all data)
export async function getStats() {
  try {
    const supabase = await createServerSupabaseClient()

    const [totalRes, activeRes, finishedRes, rejectedRes, mpsRes, clubsRes, votingsRes, printsRes] = await Promise.all([
      supabase.from("legislative_processes").select("id", { count: "exact", head: true }),
      supabase.from("legislative_processes").select("id", { count: "exact", head: true }).eq("is_finished", false).eq("is_rejected", false),
      supabase.from("legislative_processes").select("id", { count: "exact", head: true }).eq("is_finished", true),
      supabase.from("legislative_processes").select("id", { count: "exact", head: true }).eq("is_rejected", true),
      supabase.from("mps").select("id", { count: "exact", head: true }).eq("active", true),
      supabase.from("clubs").select("id", { count: "exact", head: true }),
      supabase.from("votings").select("id", { count: "exact", head: true }),
      supabase.from("prints").select("id", { count: "exact", head: true }),
    ])

    return {
      totalProcesses: totalRes.count || 0,
      activeProcesses: activeRes.count || 0,
      finishedProcesses: finishedRes.count || 0,
      rejectedProcesses: rejectedRes.count || 0,
      totalMPs: mpsRes.count || 0,
      totalClubs: clubsRes.count || 0,
      totalVotings: votingsRes.count || 0,
      totalPrints: printsRes.count || 0,
    }
  } catch (error) {
    console.error("[ProcessService] getStats error:", error)
    return {
      totalProcesses: 0,
      activeProcesses: 0,
      finishedProcesses: 0,
      rejectedProcesses: 0,
      totalMPs: 0,
      totalClubs: 0,
      totalVotings: 0,
      totalPrints: 0,
    }
  }
}

// Get process statistics with filters (for filtered views)
export async function getProcessStats(filters: ProcessFilters = {}) {
  try {
    const supabase = await createServerSupabaseClient()
    const { search, status, projectType } = filters

    // Build base query for filtered counts
    const buildQuery = (baseQuery: any) => {
      let query = baseQuery

      if (status === "active") {
        query = query.eq("is_finished", false).eq("is_rejected", false)
      } else if (status === "finished") {
        query = query.eq("is_finished", true)
      } else if (status === "rejected") {
        query = query.eq("is_rejected", true)
      }

      if (projectType && projectType !== "all") {
        query = query.eq("project_type", projectType)
      }

      if (search) {
        query = query.or(`title.ilike.%${search}%,number.ilike.%${search}%`)
      }

      return query
    }

    // Get filtered counts
    const [totalRes, activeRes, finishedRes, rejectedRes] = await Promise.all([
      buildQuery(supabase.from("legislative_processes").select("id", { count: "exact", head: true })),
      buildQuery(supabase.from("legislative_processes").select("id", { count: "exact", head: true })).eq("is_finished", false).eq("is_rejected", false),
      buildQuery(supabase.from("legislative_processes").select("id", { count: "exact", head: true })).eq("is_finished", true),
      buildQuery(supabase.from("legislative_processes").select("id", { count: "exact", head: true })).eq("is_rejected", true),
    ])

    // Calculate average duration for finished processes
    const avgDurationQuery = buildQuery(
      supabase
        .from("legislative_processes")
        .select("document_date, change_date")
        .eq("is_finished", true)
        .not("document_date", "is", null)
        .not("change_date", "is", null)
    )

    const { data: finishedProcessesData } = await avgDurationQuery

    let avgDuration = 0
    if (finishedProcessesData && finishedProcessesData.length > 0) {
      const durations = finishedProcessesData
        .map((p: any) => {
          const start = new Date(p.document_date).getTime()
          const end = new Date(p.change_date).getTime()
          return (end - start) / (1000 * 60 * 60 * 24) // days
        })
        .filter((d: number) => d > 0 && d < 3650) // filter out invalid durations

      if (durations.length > 0) {
        avgDuration = Math.round(durations.reduce((a: number, b: number) => a + b, 0) / durations.length)
      }
    }

    // Count processes by current stage (from timeline)
    const { data: processesWithTimeline } = await buildQuery(
      supabase
        .from("legislative_processes")
        .select("timeline, is_finished, is_rejected")
        .eq("is_finished", false)
        .eq("is_rejected", false)
    )

    const stageBreakdown: Record<string, number> = {}

    if (processesWithTimeline && processesWithTimeline.length > 0) {
      for (const proc of processesWithTimeline) {
        const timeline = proc.timeline as TimelineNode[] | undefined
        if (timeline && timeline.length > 0) {
          // Find current stage (status: "current")
          const currentNode = timeline.find(node => node.status === "current")
          if (currentNode) {
            const stageName = currentNode.name
            stageBreakdown[stageName] = (stageBreakdown[stageName] || 0) + 1
          }
        }
      }
    }

    return {
      totalProcesses: totalRes.count || 0,
      activeProcesses: activeRes.count || 0,
      finishedProcesses: finishedRes.count || 0,
      rejectedProcesses: rejectedRes.count || 0,
      avgDuration,
      stageBreakdown,
    }
  } catch (error) {
    console.error("[ProcessService] getProcessStats error:", error)
    return {
      totalProcesses: 0,
      activeProcesses: 0,
      finishedProcesses: 0,
      rejectedProcesses: 0,
      avgDuration: 0,
      stageBreakdown: {},
    }
  }
}

// Get votings
export async function getVotings(filters: { processId?: string; sittingNumber?: number; limit?: number; offset?: number } = {}) {
  try {
    const supabase = await createServerSupabaseClient()
    const { processId, sittingNumber, limit = 50, offset = 0 } = filters

    let query = supabase
      .from("votings")
      .select("*", { count: "exact" })
      .order("date", { ascending: false })

    if (processId) {
      query = query.eq("process_id", processId)
    }

    if (sittingNumber) {
      query = query.eq("sitting_number", sittingNumber)
    }

    query = query.range(offset, offset + limit - 1)

    const { data, count, error } = await query

    if (error) {
      console.error("[ProcessService] getVotings error:", error)
      return { data: [], count: 0 }
    }

    return { data: data || [], count: count || 0 }
  } catch (error) {
    console.error("[ProcessService] getVotings error:", error)
    return { data: [], count: 0 }
  }
}

// Get MPs
export async function getMPs(filters: { club?: string; active?: boolean; search?: string; limit?: number; offset?: number } = {}) {
  try {
    const supabase = await createServerSupabaseClient()
    const { club, active, search, limit = 100, offset = 0 } = filters

    let query = supabase
      .from("mps")
      .select("*", { count: "exact" })
      .order("last_name", { ascending: true })

    if (club) {
      query = query.eq("club", club)
    }

    if (active !== undefined) {
      query = query.eq("active", active)
    }

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%`)
    }

    query = query.range(offset, offset + limit - 1)

    const { data, count, error } = await query

    if (error) {
      console.error("[ProcessService] getMPs error:", error)
      return { data: [], count: 0 }
    }

    return { data: data || [], count: count || 0 }
  } catch (error) {
    console.error("[ProcessService] getMPs error:", error)
    return { data: [], count: 0 }
  }
}

// Get clubs
export async function getClubs() {
  try {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from("clubs")
      .select("*")
      .order("members_count", { ascending: false })

    if (error) {
      console.error("[ProcessService] getClubs error:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("[ProcessService] getClubs error:", error)
    return []
  }
}

