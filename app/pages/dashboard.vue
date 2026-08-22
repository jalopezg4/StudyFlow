<script setup lang="ts">
import SubjectList from '~/components/subjects/SubjectList.vue'

definePageMeta({ layout: 'authenticated' })

interface ProgressSummary {
  totalTasks: number
  completedTasks: number
  pendingTasks: number
  completionPercentage: number
  totalStudySessions: number
  totalStudyMinutes: number
  hasActivity: boolean
}

const { logout } = useAuth()
const isLoggingOut = ref(false)
const progress = ref<ProgressSummary | null>(null)
const progressStatus = ref<'loading' | 'loaded' | 'error'>('loading')

async function loadProgress() {
  progressStatus.value = 'loading'

  try {
    const response = await $fetch<{ status: string, progress: ProgressSummary }>('/api/dashboard/progress')
    progress.value = response.progress
    progressStatus.value = 'loaded'
  } catch {
    progressStatus.value = 'error'
  }
}

async function onLogout() {
  isLoggingOut.value = true
  try {
    await logout()
  } finally {
    await navigateTo('/login')
  }
}

onMounted(loadProgress)
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-10">
    <div class="mx-auto max-w-2xl rounded-xl bg-white p-8 shadow-md ring-1 ring-slate-900/5">
      <h1 class="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
      <p class="mt-4 text-slate-600">
        Your current study progress at a glance.
      </p>

      <section class="mt-6" aria-labelledby="progress-heading">
        <h2 id="progress-heading" class="text-lg font-semibold text-slate-900">Study progress</h2>

        <p v-if="progressStatus === 'loading'" class="mt-3 text-sm text-slate-600">
          Loading your progress…
        </p>

        <p v-else-if="progressStatus === 'error'" class="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          Could not load your progress. Please try again.
        </p>

        <div v-else-if="progress" class="mt-4">
          <p
            v-if="!progress.hasActivity"
            class="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600"
          >
            No study activity yet. Create a task or record a study session to start tracking your progress.
          </p>

          <div class="grid grid-cols-2 gap-3 sm:grid-cols-3" :aria-label="progress.hasActivity ? 'Progress metrics' : 'Empty progress metrics'">
            <div class="rounded-md border border-slate-200 p-3">
              <p class="text-xs font-medium uppercase tracking-wide text-slate-500">Tasks</p>
              <p class="mt-1 text-2xl font-semibold text-slate-900">{{ progress.totalTasks }}</p>
              <p class="text-xs text-slate-500">{{ progress.pendingTasks }} pending</p>
            </div>
            <div class="rounded-md border border-slate-200 p-3">
              <p class="text-xs font-medium uppercase tracking-wide text-slate-500">Completed</p>
              <p class="mt-1 text-2xl font-semibold text-slate-900">{{ progress.completedTasks }}</p>
              <p class="text-xs text-slate-500">{{ progress.completionPercentage }}% complete</p>
            </div>
            <div class="rounded-md border border-slate-200 p-3">
              <p class="text-xs font-medium uppercase tracking-wide text-slate-500">Study time</p>
              <p class="mt-1 text-2xl font-semibold text-slate-900">{{ progress.totalStudyMinutes }}</p>
              <p class="text-xs text-slate-500">minutes across {{ progress.totalStudySessions }} sessions</p>
            </div>
          </div>
        </div>
      </section>

      <div class="mt-6 flex flex-wrap gap-3">
        <NuxtLink
          to="/subjects"
          class="inline-flex w-fit items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-indigo-500 hover:shadow-md active:scale-[0.98]"
        >
          Create subject
        </NuxtLink>
        <NuxtLink
          to="/tasks"
          class="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-150 hover:border-slate-400 hover:bg-slate-50 active:scale-[0.98]"
        >
          Create task
        </NuxtLink>
        <NuxtLink
          to="/study-sessions"
          class="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-150 hover:border-slate-400 hover:bg-slate-50 active:scale-[0.98]"
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
