import { createError, setResponseStatus, type H3Event } from 'h3'
import type { SafeErrorPayload, SecurityErrorCode } from './types'

interface ErrorLike {
  statusCode?: number
  statusMessage?: string
  message?: string
  data?: unknown
}

interface SafeErrorResponse {
  statusCode: number
  error: SafeErrorPayload
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isErrorLike(value: unknown): value is ErrorLike {
  return isRecord(value)
}

export function createSafeHttpError(
  statusCode: number,
  code: SecurityErrorCode,
  message: string,
  details?: SafeErrorPayload['details']
) {
  return createError({
    statusCode,
    statusMessage: message,
    data: {
      code,
      message,
      details
    } satisfies SafeErrorPayload
  })
}

export function toSafeErrorResponse(error: unknown): SafeErrorResponse {
  if (isErrorLike(error) && typeof error.statusCode === 'number') {
    const knownCode =
      isRecord(error.data) && typeof error.data.code === 'string' ? error.data.code : undefined
    const safeCode: SecurityErrorCode =
      knownCode === 'UNAUTHENTICATED' ||
      knownCode === 'FORBIDDEN' ||
      knownCode === 'VALIDATION_ERROR' ||
      knownCode === 'INTERNAL_ERROR'
        ? knownCode
        : error.statusCode >= 500
          ? 'INTERNAL_ERROR'
          : 'VALIDATION_ERROR'

    const safeMessage =
      isRecord(error.data) && typeof error.data.message === 'string'
        ? error.data.message
        : error.statusCode >= 500
          ? 'Internal server error'
          : error.statusMessage ?? 'Request failed'

    return {
      statusCode: error.statusCode,
      error: {
        code: safeCode,
        message: safeMessage
      }
    }
  }

  return {
    statusCode: 500,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error'
    }
  }
}

export function sendSafeError(event: H3Event, error: unknown) {
  const safeResponse = toSafeErrorResponse(error)
  setResponseStatus(event, safeResponse.statusCode)
  return safeResponse
}
