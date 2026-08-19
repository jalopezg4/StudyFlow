import { RegisterRequestSchema, LoginRequestSchema } from '#shared/utils/auth-schemas'

const GENERIC_AUTH_ERROR =
  'We could not complete that request. Please check your details and try again.'

export function useAuth() {
  const { $supabase } = useNuxtApp()

  async function register(email: string, password: string): Promise<{ hasSession: boolean }> {
    const input = RegisterRequestSchema.parse({ email, password })
    const { data, error } = await $supabase.auth.signUp({
      email: input.email,
      password: input.password
    })

    if (error) {
      throw new Error(GENERIC_AUTH_ERROR)
    }

    // Supabase only returns a session for a genuinely new account (email confirmation
    // disabled). A repeat registration for an existing email succeeds without an error
    // but without a session, so the caller must not assume registration = logged in.
    return { hasSession: Boolean(data.session) }
  }

  async function login(email: string, password: string): Promise<void> {
    const input = LoginRequestSchema.parse({ email, password })
    const { error } = await $supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password
    })

    if (error) {
      throw new Error(GENERIC_AUTH_ERROR)
    }
  }

  async function logout(): Promise<void> {
    await $supabase.auth.signOut()
  }

  return { register, login, logout }
}
