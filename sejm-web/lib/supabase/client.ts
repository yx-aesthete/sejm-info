import { createBrowserClient } from "@supabase/ssr"

const globalForSupabase = globalThis as typeof globalThis & {
  supabaseClient?: ReturnType<typeof createBrowserClient>
}

export function createClient() {
  if (globalForSupabase.supabaseClient) {
    return globalForSupabase.supabaseClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SEJMSUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SEJMSUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables")
  }

  globalForSupabase.supabaseClient = createBrowserClient(supabaseUrl, supabaseKey)
  return globalForSupabase.supabaseClient
}
