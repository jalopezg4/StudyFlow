import type { H3Event } from 'h3'
import { sendSafeError } from '../../utils/security/errors'

export async function executeProtectedHandler<T>(
  event: H3Event,
  callback: () => Promise<T>
): Promise<T | ReturnType<typeof sendSafeError>> {
  try {
    return await callback()
  } catch (error) {
    return sendSafeError(event, error)
  }
}
