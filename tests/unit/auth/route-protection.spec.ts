import { describe, expect, it } from 'vitest'
import { resolveRouteGuardAction } from '../../../shared/utils/route-protection'

describe('resolveRouteGuardAction', () => {
  it('redirects unauthenticated visitors away from a private path to /login', () => {
    const action = resolveRouteGuardAction('/dashboard', false)

    expect(action).toEqual({ type: 'redirect', to: '/login' })
  })

  it('redirects unauthenticated visitors away from a nested private path to /login', () => {
    const action = resolveRouteGuardAction('/dashboard/settings', false)

    expect(action).toEqual({ type: 'redirect', to: '/login' })
  })

  it('protects study-session pages from unauthenticated visitors', () => {
    const action = resolveRouteGuardAction('/study-sessions', false)

    expect(action).toEqual({ type: 'redirect', to: '/login' })
  })

  it('allows authenticated users to access a private path', () => {
    const action = resolveRouteGuardAction('/dashboard', true)

    expect(action).toEqual({ type: 'allow' })
  })

  it('redirects authenticated users away from /login to /dashboard', () => {
    const action = resolveRouteGuardAction('/login', true)

    expect(action).toEqual({ type: 'redirect', to: '/dashboard' })
  })

  it('redirects authenticated users away from /register to /dashboard', () => {
    const action = resolveRouteGuardAction('/register', true)

    expect(action).toEqual({ type: 'redirect', to: '/dashboard' })
  })

  it('allows unauthenticated visitors to reach /login', () => {
    const action = resolveRouteGuardAction('/login', false)

    expect(action).toEqual({ type: 'allow' })
  })

  it('redirects unauthenticated visitors from the root path to /login', () => {
    expect(resolveRouteGuardAction('/', false)).toEqual({ type: 'redirect', to: '/login' })
  })

  it('redirects authenticated visitors from the root path to /dashboard', () => {
    expect(resolveRouteGuardAction('/', true)).toEqual({ type: 'redirect', to: '/dashboard' })
  })

  it('allows any visitor on a public path unrelated to auth', () => {
    expect(resolveRouteGuardAction('/some-public-page', false)).toEqual({ type: 'allow' })
    expect(resolveRouteGuardAction('/some-public-page', true)).toEqual({ type: 'allow' })
  })
})
