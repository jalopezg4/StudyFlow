export interface AuthenticatedPrincipal {
  userId: string
}

export type SecurityErrorCode =
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'VALIDATION_ERROR'
  | 'INTERNAL_ERROR'

export interface ValidationIssue {
  path: string
  message: string
}

export interface SafeErrorPayload {
  code: SecurityErrorCode
  message: string
  details?: {
    source?: 'body' | 'query' | 'params'
    issues?: ValidationIssue[]
  }
}

export interface OwnedResourceReference {
  ownerId: string
}
