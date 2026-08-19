import { resolveRouteGuardAction } from '#shared/utils/route-protection'

export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) {
    return
  }

  const { $supabase } = useNuxtApp()

  const {
    data: { session }
  } = await $supabase.auth.getSession()

  const action = resolveRouteGuardAction(to.path, Boolean(session))

  if (action.type === 'redirect') {
    return navigateTo(action.to)
  }
})
