<script setup lang="ts">
import SubjectList from '~/components/subjects/SubjectList.vue'

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
      <div class="mt-6 flex flex-wrap gap-3">
        <NuxtLink
          to="/subjects"
          class="inline-flex w-fit items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Create subject
        </NuxtLink>
        <NuxtLink
          to="/tasks"
          class="inline-flex w-fit items-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Create task
        </NuxtLink>
        <NuxtLink
          to="/study-sessions"
          class="inline-flex w-fit items-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Record study session
        </NuxtLink>
      </div>

      <div class="mt-8 border-t border-slate-200 pt-6">
        <SubjectList />
      </div>
    </div>
  </div>
</template>
