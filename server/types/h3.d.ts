import 'h3'
import type { SupabaseClient } from '@supabase/supabase-js'

declare module 'h3' {
  interface H3EventContext {
    auth?: {
      userId: string
    }
    supabase?: SupabaseClient
  }
}
