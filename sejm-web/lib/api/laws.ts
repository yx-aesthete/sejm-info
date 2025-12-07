import { createClient } from "@/lib/supabase/server"
import { EXTENDED_PROCESSES } from "@/lib/legislative-extended-schema"

export async function getLaws() {
  // In production, this will fetch from database populated by scraper
  return EXTENDED_PROCESSES
}

export async function getLawByDrukNumber(drukNumber: string) {
  // Find process by druk number
  const process = EXTENDED_PROCESSES.find((p) => {
    const match = p.documentNumber.match(/(\d+)/)
    return match && match[1] === drukNumber
  })
  return process || null
}

export async function getWatchedLaws(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.from("watched_laws").select("*").eq("user_id", userId)

  if (error) throw error
  return data || []
}

export async function watchLaw(userId: string, drukId: string, drukNumber: string, title: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("watched_laws")
    .insert({
      user_id: userId,
      druk_id: drukId,
      druk_number: drukNumber,
      title: title,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function unwatchLaw(userId: string, drukId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("watched_laws").delete().eq("user_id", userId).eq("druk_id", drukId)

  if (error) throw error
}

export async function getNotifications(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) throw error
  return data || []
}

export async function getUnreadNotificationCount(userId: string) {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false)

  if (error) return 0
  return count || 0
}

export async function markNotificationRead(notificationId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", notificationId)

  if (error) throw error
}

export async function incrementViewCount(drukId: string) {
  const supabase = await createClient()

  // Upsert - insert if not exists, increment if exists
  const { data: existing } = await supabase.from("law_stats").select("view_count").eq("druk_id", drukId).single()

  if (existing) {
    await supabase
      .from("law_stats")
      .update({ view_count: (existing.view_count || 0) + 1, updated_at: new Date().toISOString() })
      .eq("druk_id", drukId)
  } else {
    await supabase.from("law_stats").insert({ druk_id: drukId, view_count: 1 })
  }
}
