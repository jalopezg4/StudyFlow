<script setup lang="ts">
const { logout } = useAuth()
const isLoggingOut = ref(false)

async function onLogout() {
  isLoggingOut.value = true
  try {
    await logout()
  } finally {
    await navigateTo('/login')
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 px-4 py-10">
    <div class="mx-auto max-w-2xl rounded-lg bg-white p-8 shadow">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <button
          type="button"
          :disabled="isLoggingOut"
          class="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          @click="onLogout"
        >
          {{ isLoggingOut ? 'Logging out…' : 'Log out' }}
        </button>
      </div>
      <p class="mt-4 text-slate-600">
        Welcome to StudyFlow. This page is only reachable while you are logged in.
      </p>
    </div>
  </div>
</template>
