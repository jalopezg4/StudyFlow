<script setup lang="ts">
import { onMounted, ref } from 'vue'

interface StudyTask {
  id: string
  subjectId: string
  subjectName: string
  title: string
  description: string | null
  dueDate: string | null
  status: 'pending' | 'completed'
  createdAt: string
}

type Status = 'idle' | 'loading' | 'success' | 'error'

const task = ref<StudyTask | null>(null)
const status = ref<Status>('idle')
const errorMessage = ref('')
const actionStatus = ref<'idle' | 'loading' | 'error' | 'success'>('idle')
const actionMessage = ref('')

async function loadRecommendation() {
  status.value = 'loading'
  errorMessage.value = ''

  try {
    const response = await $fetch<{ status: string, task: StudyTask | null }>('/api/tasks/recommendation')
    task.value = response.task
    status.value = 'success'
  } catch (error) {
    const fetchError = error as { data?: { error?: { message?: string } } }
    status.value = 'error'
    errorMessage.value = fetchError.data?.error?.message ?? 'Could not load a recommendation. Please try again.'
  }
}

function recommendationReason(currentTask: StudyTask): string {
  if (currentTask.dueDate) {
    return 'Recommended because it has the earliest due date among your pending tasks.'
  }

  return 'Recommended because it is your oldest pending task without a due date.'
}

async function markRecommendedTaskComplete() {
  if (!task.value) {
    return
  }

  actionStatus.value = 'loading'
  actionMessage.value = ''

  try {
    await $fetch<{ status: string, task: StudyTask }>(`/api/tasks/${task.value.id}`, {
      method: 'PATCH',
      body: { status: 'completed' as const }
    })
    await loadRecommendation()
    actionStatus.value = 'success'
    actionMessage.value = 'Task marked as complete. Recommendation refreshed.'
  } catch (error) {
    const fetchError = error as { data?: { error?: { message?: string } } }
    actionStatus.value = 'error'
    actionMessage.value = fetchError.data?.error?.message ?? 'Could not update the task status. Please try again.'
  }
}

onMounted(loadRecommendation)

defineExpose({ refresh: loadRecommendation })
</script>

<template>
  <div class="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-5 shadow-sm">
    <h2 class="text-xs font-bold uppercase tracking-wider text-indigo-600">Study this next</h2>

    <p v-if="status === 'loading'" class="mt-2 text-sm text-slate-600">
      Finding your next task…
    </p>

    <p v-else-if="status === 'error'" class="mt-2 text-sm text-red-700" role="alert">
      {{ errorMessage }}
    </p>

    <p v-else-if="!task" class="mt-2 text-sm text-slate-600">
      Nothing to recommend right now — you're all caught up.
    </p>

    <div v-else class="mt-2">
      <span class="mr-2 rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
        {{ task.subjectName || 'Unknown subject' }}
      </span>
      <strong class="text-base font-semibold text-slate-900">{{ task.title }}</strong>
      <span v-if="task.dueDate" class="ml-2 text-xs text-slate-400">Due {{ task.dueDate }}</span>
      <span v-else class="ml-2 text-xs text-slate-400">No due date</span>

      <p class="mt-2 text-sm text-slate-600">
        {{ recommendationReason(task) }}
      </p>

      <div class="mt-3 flex items-center gap-2">
        <button
          type="button"
          :disabled="actionStatus === 'loading'"
          class="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          @click="markRecommendedTaskComplete"
        >
          {{ actionStatus === 'loading' ? 'Marking…' : 'Mark complete' }}
        </button>
      </div>

      <p
        v-if="actionStatus === 'error'"
        class="mt-2 text-sm text-red-700"
        role="alert"
      >
        {{ actionMessage }}
      </p>

      <p
        v-else-if="actionStatus === 'success'"
        class="mt-2 text-sm text-emerald-700"
      >
        {{ actionMessage }}
      </p>
    </div>
  </div>
</template>
