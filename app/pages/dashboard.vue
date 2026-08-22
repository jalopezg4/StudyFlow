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

onMounted(loadProgress)
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-10">
    <div class="mx-auto max-w-2xl rounded-xl bg-white p-8 shadow-md ring-1 ring-slate-900/5">
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">StudyFlow</p>
          <h1 class="mt-1 text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
        </div>
        <div class="hidden rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 sm:block">
          Progress overview
        </div>
      </div>
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

          <div class="mt-5 rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-slate-50 p-5 shadow-sm">
            <div class="flex items-end justify-between gap-4">
              <div>
                <p class="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">Completion rate</p>
                <p class="mt-2 text-3xl font-bold tracking-tight text-slate-900">{{ progress.completionPercentage }}%</p>
              </div>
              <p class="text-right text-sm font-medium text-slate-600">
                {{ progress.completedTasks }} of {{ progress.totalTasks }} tasks complete
              </p>
            </div>
            <div
              class="mt-4 h-3 overflow-hidden rounded-full bg-indigo-100"
              role="progressbar"
              aria-label="Task completion progress"
              :aria-valuenow="progress.completionPercentage"
              aria-valuemin="0"
              aria-valuemax="100"
            >
              <div
                class="h-full rounded-full bg-indigo-600 transition-all duration-700 ease-out"
                :style="{ width: `${progress.completionPercentage}%` }"
              />
            </div>
          </div>

          <div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3" :aria-label="progress.hasActivity ? 'Progress metrics' : 'Empty progress metrics'">
            <div class="rounded-xl border border-slate-200 border-l-4 border-l-slate-400 bg-white p-4 shadow-sm">
              <p class="text-xs font-bold uppercase tracking-wide text-slate-500">Tasks</p>
              <p class="mt-2 text-2xl font-semibold text-slate-900">{{ progress.totalTasks }}</p>
              <p class="mt-1 text-xs text-slate-500">{{ progress.pendingTasks }} pending</p>
            </div>
            <div class="rounded-xl border border-emerald-100 border-l-4 border-l-emerald-500 bg-emerald-50/40 p-4 shadow-sm">
              <p class="text-xs font-bold uppercase tracking-wide text-emerald-700">Completed</p>
              <p class="mt-2 text-2xl font-semibold text-slate-900">{{ progress.completedTasks }}</p>
              <p class="mt-1 text-xs text-emerald-700">tasks finished</p>
            </div>
            <div class="col-span-2 rounded-xl border border-amber-100 border-l-4 border-l-amber-500 bg-amber-50/40 p-4 shadow-sm sm:col-span-1">
              <p class="text-xs font-bold uppercase tracking-wide text-amber-700">Study time</p>
              <p class="mt-2 text-2xl font-semibold text-slate-900">{{ progress.totalStudyMinutes }}</p>
              <p class="mt-1 text-xs text-amber-700">minutes across {{ progress.totalStudySessions }} sessions</p>
            </div>
          </div>
        </div>
      </section>

      <div class="mt-6 flex flex-wrap gap-3">
        <NuxtLink
          to="/subjects"
          class="inline-flex w-fit items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-indigo-500 hover:shadow-md active:scale-[0.98]"
        >
          My Subjects
        </NuxtLink>
        <NuxtLink
          to="/tasks"
          class="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-150 hover:border-slate-400 hover:bg-slate-50 active:scale-[0.98]"
        >
          My Tasks
        </NuxtLink>
        <NuxtLink
          to="/study-sessions"
          class="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-150 hover:border-slate-400 hover:bg-slate-50 active:scale-[0.98]"
        >
          Study Sessions
        </NuxtLink>
      </div>

      <div class="mt-8 border-t border-slate-200 pt-6">
        <SubjectList />
      </div>
    </div>
  </div>
</template>
