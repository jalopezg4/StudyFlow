export const PRIVATE_PATH_PREFIXES = ['/dashboard']
export const AUTH_ONLY_PATHS = ['/login', '/register']

export function isPrivatePath(path: string): boolean {
  return PRIVATE_PATH_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))
}

export function isAuthOnlyPath(path: string): boolean {
  return AUTH_ONLY_PATHS.includes(path)
}

export type RouteGuardAction = { type: 'allow' } | { type: 'redirect'; to: string }

export function resolveRouteGuardAction(path: string, isAuthenticated: boolean): RouteGuardAction {
  if (isPrivatePath(path) && !isAuthenticated) {
    return { type: 'redirect', to: '/login' }
  }

  if (isAuthOnlyPath(path) && isAuthenticated) {
    return { type: 'redirect', to: '/dashboard' }
  }

  return { type: 'allow' }
}
