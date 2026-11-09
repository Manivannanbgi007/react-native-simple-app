import { isAxiosError } from 'axios';

/**
 * Turns any error into a short message a person can understand.
 *
 * Axios errors carry clues about WHAT went wrong:
 *  - error.code === 'ECONNABORTED'/'ETIMEDOUT' -> the request took longer than the timeout
 *  - no error.response                         -> the server was never reached (offline, DNS, ...)
 *  - error.response.status                     -> the server answered with an error code (404, 500, ...)
 *
 * Anything else (for example our own "unexpected format" error from the
 * user service) already has a readable message, so we show it as-is.
 */
export const MESSAGES = {
  timeout: 'The request timed out. Check your connection and try again.',
  network: 'Cannot reach the server. Check your internet connection and try again.',
  notFound: 'This user was not found on the server.',
  unknown: 'Something went wrong. Please try again.',
} as const;

export function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return MESSAGES.timeout;
    }
    if (!error.response) {
      return MESSAGES.network;
    }

    const { status } = error.response;
    if (status === 404) {
      return MESSAGES.notFound;
    }
    if (status >= 500) {
      return `The server had a problem (HTTP ${status}). Please try again later.`;
    }
    return `The request was rejected by the server (HTTP ${status}).`;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }
  return MESSAGES.unknown;
}
