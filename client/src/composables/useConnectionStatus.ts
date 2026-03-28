import { ref, onMounted, onUnmounted } from 'vue'

export function useConnectionStatus() {
  const isOnline = ref(true)
  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  let healthPoll: ReturnType<typeof setInterval> | null = null

  function setOnline() {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
    isOnline.value = true
  }

  function setOfflineDebounced() {
    if (debounceTimer) return
    debounceTimer = setTimeout(() => {
      isOnline.value = false
      debounceTimer = null
    }, 2000)
  }

  async function checkHealth() {
    try {
      const res = await fetch('/api/health', { signal: AbortSignal.timeout(3000) })
      if (res.ok) setOnline()
      else setOfflineDebounced()
    } catch {
      setOfflineDebounced()
    }
  }

  onMounted(() => {
    window.addEventListener('online', setOnline)
    window.addEventListener('offline', setOfflineDebounced)
    healthPoll = setInterval(checkHealth, 5000)
  })

  onUnmounted(() => {
    window.removeEventListener('online', setOnline)
    window.removeEventListener('offline', setOfflineDebounced)
    if (healthPoll) clearInterval(healthPoll)
    if (debounceTimer) clearTimeout(debounceTimer)
  })

  return { isOnline }
}
