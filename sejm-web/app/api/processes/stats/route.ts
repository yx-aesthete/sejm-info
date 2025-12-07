import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { searchParams } = new URL(request.url)
    
    const search = searchParams.get("search") || undefined
    const status = searchParams.get("status") as "all" | "active" | "finished" | "rejected" | undefined
    const projectType = searchParams.get("projectType") || undefined

    // Build base query conditions
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

    // Get counts with filters applied
    const [totalRes, activeRes, finishedRes, rejectedRes] = await Promise.all([
      // Total with current filters
      buildQuery(supabase.from("legislative_processes").select("id", { count: "exact", head: true })),
      // Active (in-progress) with current filters except status
      supabase
        .from("legislative_processes")
        .select("id", { count: "exact", head: true })
        .eq("is_finished", false)
        .eq("is_rejected", false)
        .then(res => {
          // Apply other filters
          if (projectType && projectType !== "all") {
            return supabase
              .from("legislative_processes")
              .select("id", { count: "exact", head: true })
              .eq("is_finished", false)
              .eq("is_rejected", false)
              .eq("project_type", projectType)
          }
          return res
        }),
      // Finished with current filters except status  
      supabase
        .from("legislative_processes")
        .select("id", { count: "exact", head: true })
        .eq("is_finished", true),
      // Rejected with current filters except status
      supabase
        .from("legislative_processes")
        .select("id", { count: "exact", head: true })
        .eq("is_rejected", true),
    ])

    // Calculate average duration (simplified - just return placeholder for now)
    const avgDuration = 45

    return NextResponse.json({
      data: {
        totalProcesses: totalRes.count || 0,
        activeProcesses: activeRes.count || 0,
        finishedProcesses: finishedRes.count || 0,
        rejectedProcesses: rejectedRes.count || 0,
        avgDuration,
      }
    })
  } catch (error) {
    console.error("[API/processes/stats] Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
