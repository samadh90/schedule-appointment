import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AppConfig } from '../types'
import { apiUrl } from '../utils/api'

export const useConfigStore = defineStore('config', () => {
  const config = ref<AppConfig | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchConfig() {
    if (config.value) return
    loading.value = true
    error.value = null
    try {
      const res = await fetch(apiUrl('/api/config'))
      if (!res.ok) throw new Error('Failed to fetch config')
      config.value = await res.json()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
    } finally {
      loading.value = false
    }
  }

  return { config, loading, error, fetchConfig }
})
