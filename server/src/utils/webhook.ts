const TIMEOUT_MS = 3_000
const MAX_ATTEMPTS = 3

/**
 * Fire-and-forget POST to a webhook URL.
 * Retries up to 3 times with exponential backoff (500ms, 1000ms).
 * Never throws — all errors are logged as warnings.
 */
export function fireWebhook(url: string, payload: object): void {
  void _send(url, payload)
}

async function _send(url: string, payload: object): Promise<void> {
  const body = JSON.stringify(payload)
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        signal: controller.signal,
      })
      if (res.ok) return
      console.warn(`[webhook] Attempt ${attempt}/${MAX_ATTEMPTS} failed — HTTP ${res.status}`)
    } catch (err) {
      console.warn(`[webhook] Attempt ${attempt}/${MAX_ATTEMPTS} error:`, (err as Error).message)
    } finally {
      clearTimeout(timer)
    }
    if (attempt < MAX_ATTEMPTS) {
      await new Promise<void>(r => setTimeout(r, 500 * 2 ** (attempt - 1)))
    }
  }
  console.warn(`[webhook] All ${MAX_ATTEMPTS} attempts failed for ${url}`)
}
