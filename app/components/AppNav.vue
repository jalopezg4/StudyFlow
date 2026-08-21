<script setup lang="ts">
const route = useRoute()
const { logout } = useAuth()
const isLoggingOut = ref(false)

const links = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'My Subjects', path: '/subjects' },
  { label: 'My Tasks', path: '/tasks' },
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
  <nav class="border-b border-slate-200 bg-white">
    <div class="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
      <div class="flex items-center gap-1">
        <NuxtLink
          v-for="link in links"
          :key="link.path"
          :to="link.path"
          class="rounded-md px-3 py-2 text-sm font-medium"
          :class="
            route.path === link.path
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          "
        >
          {{ link.label }}
        </NuxtLink>
      </div>
      <button
        type="button"
        :disabled="isLoggingOut"
        class="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
        @click="onLogout"
      >
        {{ isLoggingOut ? 'Logging out…' : 'Log out' }}
      </button>
    </div>
  </nav>
</template>
