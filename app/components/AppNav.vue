<script setup lang="ts">
const route = useRoute()
const { logout } = useAuth()
const isLoggingOut = ref(false)

const links = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'My Subjects', path: '/subjects' },
  { label: 'My Tasks', path: '/tasks' },
  { label: 'Study Sessions', path: '/study-sessions' },
]

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
  <nav class="sticky top-0 z-20 border-b border-slate-200 bg-white/85 shadow-sm backdrop-blur-sm">
    <div class="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
      <div class="flex items-center gap-1">
        <NuxtLink
          v-for="link in links"
          :key="link.path"
          :to="link.path"
          class="rounded-full px-3.5 py-2 text-sm font-semibold transition-all duration-150"
          :class="
            route.path === link.path
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-indigo-600'
          "
        >
          {{ link.label }}
        </NuxtLink>
      </div>
      <button
        type="button"
        :disabled="isLoggingOut"
        class="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-600 transition-colors duration-150 hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
        @click="onLogout"
      >
        {{ isLoggingOut ? 'Logging out…' : 'Log out' }}
      </button>
    </div>
  </nav>
</template>
