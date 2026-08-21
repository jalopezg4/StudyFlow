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

onMounted(loadRecommendation)

defineExpose({ refresh: loadRecommendation })
</script>

<template>
  <div class="rounded-lg border border-slate-200 bg-slate-50 p-4">
    <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500">Study this next</h2>

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
      <span class="mr-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
        {{ task.subjectName || 'Unknown subject' }}
      </span>
      <strong class="text-base font-medium text-slate-900">{{ task.title }}</strong>
      <span v-if="task.dueDate" class="ml-2 text-xs text-slate-400">Due {{ task.dueDate }}</span>
      <span v-else class="ml-2 text-xs text-slate-400">No due date</span>
    </div>
  </div>
</template>
