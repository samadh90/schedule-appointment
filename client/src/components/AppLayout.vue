<template>
  <div class="min-h-screen bg-slate-50">
    <header class="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
      <router-link to="/" class="text-lg font-semibold text-slate-800">📅 Book an Appointment</router-link>
      <nav class="flex gap-4 text-sm">
        <router-link to="/" class="text-slate-600 hover:text-slate-800 transition-colors">Schedule</router-link>
        <router-link to="/cancel" class="text-slate-600 hover:text-slate-800 transition-colors">Cancel</router-link>
      </nav>
    </header>
    <main class="max-w-2xl mx-auto px-4 py-8">
      <slot />
    </main>
  </div>
</template>
