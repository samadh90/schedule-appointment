<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import AppLayout from './components/AppLayout.vue'
import { useAppointmentsStore } from './stores/appointments'

const appointmentsStore = useAppointmentsStore()
onMounted(() => appointmentsStore.connect())
onUnmounted(() => appointmentsStore.disconnect())
</script>

<template>
  <AppLayout>
    <router-view />
  </AppLayout>
</template>
