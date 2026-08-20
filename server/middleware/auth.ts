import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr'
import { defineEventHandler, getRequestHeader, sendRedirect, setHeader } from 'h3'
import { resolveRouteGuardAction } from '../../shared/utils/route-protection'
import { resolveAuthContext } from '../utils/security/session'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  const supabase = createServerClient(config.public.supabaseUrl, config.public.supabaseAnonKey, {
    cookies: {
      getAll() {
        return parseCookieHeader(getRequestHeader(event, 'cookie') ?? '')
      },
      setAll(cookiesToSet) {
        const serializedCookies = cookiesToSet.map(({ name, value, options }) =>
          serializeCookieHeader(name, value, options)
        )

        if (serializedCookies.length > 0) {
          setHeader(event, 'set-cookie', serializedCookies)
        }
      }
    }
  })

  const {
    data: { user }
  } = await supabase.auth.getUser()

  event.context.auth = resolveAuthContext(user)
  // Reused by server/utils/security/auth.ts's requireRequestSupabaseClient so
  // repository writes/reads run as the caller's own session (RLS-enforced),
  // instead of a separately constructed service-role client that bypasses RLS.
  event.context.supabase = supabase

  const path = event.path.split('?')[0]
  const action = resolveRouteGuardAction(path, Boolean(event.context.auth))

  if (action.type === 'redirect') {
    return sendRedirect(event, action.to)
  }
})
