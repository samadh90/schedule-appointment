let _base = ''

export function setApiBase(base: string): void {
  _base = base.replace(/\/$/, '')
}

/** Prepend the configured API base URL to a path (e.g. '/api/config'). */
export function apiUrl(path: string): string {
  return `${_base}${path}`
}

/**
 * Origin for the Socket.IO connection.
 * Returns undefined when no base is set so socket.io-client defaults to the
 * current page's origin (correct for the standalone SPA case).
 */
export function apiSocketOrigin(): string | undefined {
  return _base || undefined
}
