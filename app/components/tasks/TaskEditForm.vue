<script setup lang="ts">
import { reactive, ref } from 'vue'

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

const props = defineProps<{ task: StudyTask }>()

const emit = defineEmits<{
  updated: [task: StudyTask]
  cancel: []
}>()

const TITLE_MAX_LENGTH = 100
const DESCRIPTION_MAX_LENGTH = 500

const form = reactive({
  title: props.task.title,
  description: props.task.description ?? '',
  dueDate: props.task.dueDate ?? ''
})

type Status = 'idle' | 'loading' | 'error'

const status = ref<Status>('idle')
const errorMessage = ref('')

function validate(): string | null {
  const trimmedTitle = form.title.trim()

  if (trimmedTitle.length === 0) {
    return 'Title is required.'
  }

  if (trimmedTitle.length > TITLE_MAX_LENGTH) {
    return `Title cannot exceed ${TITLE_MAX_LENGTH} characters.`
  }

  if (form.description.trim().length > DESCRIPTION_MAX_LENGTH) {
    return `Description cannot exceed ${DESCRIPTION_MAX_LENGTH} characters.`
  }

  return null
}

function extractErrorMessage(error: unknown): string {
  const fetchError = error as { data?: { error?: { message?: string } } }
  return fetchError.data?.error?.message ?? 'Could not update the task. Please try again.'
}

async function handleSubmit() {
  const clientError = validate()

  if (clientError) {
    status.value = 'error'
    errorMessage.value = clientError
    return
  }

  status.value = 'loading'
  errorMessage.value = ''

  try {
    const response = await $fetch<{ status: string, task: StudyTask }>(`/api/tasks/${props.task.id}`, {
      method: 'PATCH',
      body: {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        dueDate: form.dueDate || undefined
      }
    })

    status.value = 'idle'
    emit('updated', response.task)
  } catch (error) {
    status.value = 'error'
    errorMessage.value = extractErrorMessage(error)
  }
}
</script>

<template>
  <form novalidate class="flex flex-col gap-3" @submit.prevent="handleSubmit">
    <div class="flex flex-col gap-1">
      <label :for="`task-edit-title-${task.id}`" class="text-sm font-medium text-slate-700">Title</label>
      <input
        :id="`task-edit-title-${task.id}`"
        v-model="form.title"
        type="text"
        :maxlength="TITLE_MAX_LENGTH"
        :disabled="status === 'loading'"
        required
        class="rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
      >
    </div>

    <div class="flex flex-col gap-1">
      <label :for="`task-edit-description-${task.id}`" class="text-sm font-medium text-slate-700">Description (optional)</label>
      <textarea
        :id="`task-edit-description-${task.id}`"
        v-model="form.description"
        :maxlength="DESCRIPTION_MAX_LENGTH"
        :disabled="status === 'loading'"
        class="rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
      />
    </div>

    <div class="flex flex-col gap-1">
      <label :for="`task-edit-due-date-${task.id}`" class="text-sm font-medium text-slate-700">Due date (optional)</label>
      <input
        :id="`task-edit-due-date-${task.id}`"
        v-model="form.dueDate"
        type="text"
        inputmode="numeric"
        placeholder="YYYY-MM-DD"
        pattern="\d{4}-\d{2}-\d{2}"
        :disabled="status === 'loading'"
        class="rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
      >
      <p class="text-xs text-slate-400">Any date is allowed, including past ones. Format: YYYY-MM-DD.</p>
    </div>

    <div class="flex gap-2">
      <button
        type="submit"
        :disabled="status === 'loading'"
        class="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {{ status === 'loading' ? 'Saving…' : 'Save' }}
      </button>
      <button
        type="button"
        :disabled="status === 'loading'"
        class="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 disabled:opacity-60"
        @click="emit('cancel')"
      >
        Cancel
      </button>
    </div>

    <p v-if="status === 'error'" class="text-sm text-red-700" role="alert">
      {{ errorMessage }}
    </p>
  </form>
</template>
