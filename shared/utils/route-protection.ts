export const PRIVATE_PATH_PREFIXES = ['/dashboard', '/subjects', '/tasks', '/study-sessions']
export const AUTH_ONLY_PATHS = ['/login', '/register']

export function isPrivatePath(path: string): boolean {
  return PRIVATE_PATH_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))
}

export function isAuthOnlyPath(path: string): boolean {
  return AUTH_ONLY_PATHS.includes(path)
}

export type RouteGuardAction = { type: 'allow' } | { type: 'redirect'; to: string }

export function resolveRouteGuardAction(path: string, isAuthenticated: boolean): RouteGuardAction {
  if (path === '/') {
    return { type: 'redirect', to: isAuthenticated ? '/dashboard' : '/login' }
  }

  if (isPrivatePath(path) && !isAuthenticated) {
    return { type: 'redirect', to: '/login' }
  }

  if (isAuthOnlyPath(path) && isAuthenticated) {
    return { type: 'redirect', to: '/dashboard' }
  }

  return { type: 'allow' }
}
