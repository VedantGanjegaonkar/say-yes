import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  // Surfaced early in dev so a missing .env doesn't fail as a confusing network error.
  console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — check your .env')
}

// No auth/session — this is an anonymous, no-login app. RLS gates every table.
export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})
