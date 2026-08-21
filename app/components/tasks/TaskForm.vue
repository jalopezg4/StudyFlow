<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'

interface Subject {
  id: string
  name: string
  description: string | null
  createdAt: string
}

interface CreatedTask {
  id: string
  subjectId: string
  title: string
  description: string | null
  dueDate: string | null
  status: 'pending' | 'completed'
  createdAt: string
}

const emit = defineEmits<{
  created: [task: CreatedTask]
}>()

const TITLE_MAX_LENGTH = 100
const DESCRIPTION_MAX_LENGTH = 500

const form = reactive({
  subjectId: '',
  title: '',
  description: '',
  dueDate: ''
})

type Status = 'idle' | 'loading' | 'success' | 'error'

const status = ref<Status>('idle')
const errorMessage = ref('')
const subjects = ref<Subject[]>([])
const subjectsStatus = ref<'loading' | 'loaded' | 'error'>('loading')

function validate(): string | null {
  if (!form.subjectId) {
    return 'Choose a subject.'
  }

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

  if (form.dueDate) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.dueDate)) {
      return 'Due date must be in YYYY-MM-DD format.'
    }

    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    if (form.dueDate < todayStr) {
      return 'Due date cannot be in the past.'
    }
  }

  return null
}

function extractErrorMessage(error: unknown): string {
  const fetchError = error as { data?: { error?: { message?: string } } }
  return fetchError.data?.error?.message ?? 'Could not create the task. Please try again.'
}

async function loadSubjects() {
  subjectsStatus.value = 'loading'

  try {
    const response = await $fetch<{ status: string, subjects: Subject[] }>('/api/subjects')
    subjects.value = response.subjects
    subjectsStatus.value = 'loaded'
  } catch {
    subjectsStatus.value = 'error'
  }
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
    const response = await $fetch<{ status: string, task: CreatedTask }>('/api/tasks', {
      method: 'POST',
      body: {
        subjectId: form.subjectId,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        dueDate: form.dueDate || undefined
      }
    })

    status.value = 'success'
    form.title = ''
    form.description = ''
    form.dueDate = ''
    emit('created', response.task)
  } catch (error) {
    status.value = 'error'
    errorMessage.value = extractErrorMessage(error)
  }
}

onMounted(loadSubjects)
</script>

<template>
  <form novalidate class="flex flex-col gap-4" @submit.prevent="handleSubmit">
    <div>
      <label for="task-subject" class="block text-sm font-medium text-slate-700">Subject</label>
      <select
        id="task-subject"
        v-model="form.subjectId"
        :disabled="status === 'loading' || subjectsStatus === 'loading'"
        required
        class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none disabled:bg-slate-100"
      >
        <option value="" disabled>Choose a subject</option>
        <option v-for="subject in subjects" :key="subject.id" :value="subject.id">
          {{ subject.name }}
        </option>
      </select>
      <p v-if="subjectsStatus === 'loaded' && subjects.length === 0" class="mt-1 text-xs text-slate-400">
        You don't have any subjects yet. Create one first.
      </p>
      <p v-else-if="subjectsStatus === 'error'" class="mt-1 text-xs text-red-700">
        Could not load your subjects. Please try again.
      </p>
    </div>

    <div>
      <label for="task-title" class="block text-sm font-medium text-slate-700">Title</label>
      <input
        id="task-title"
        v-model="form.title"
        type="text"
        placeholder="e.g. Read chapter 3"
        :maxlength="TITLE_MAX_LENGTH"
        :disabled="status === 'loading'"
        required
        class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none disabled:bg-slate-100"
      >
      <p class="mt-1 text-xs text-slate-400">{{ form.title.length }}/{{ TITLE_MAX_LENGTH }}</p>
    </div>

    <div>
      <label for="task-description" class="block text-sm font-medium text-slate-700">
        Description <span class="font-normal text-slate-400">(optional)</span>
      </label>
      <textarea
        id="task-description"
        v-model="form.description"
        rows="3"
        placeholder="Brief notes about this task"
        :maxlength="DESCRIPTION_MAX_LENGTH"
        :disabled="status === 'loading'"
        class="mt-1 w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none disabled:bg-slate-100"
      />
      <p class="mt-1 text-xs text-slate-400">
        {{ form.description.length }}/{{ DESCRIPTION_MAX_LENGTH }}
      </p>
    </div>

    <div>
      <label for="task-due-date" class="block text-sm font-medium text-slate-700">
        Due date <span class="font-normal text-slate-400">(optional)</span>
      </label>
      <input
        id="task-due-date"
        v-model="form.dueDate"
        type="text"
        inputmode="numeric"
        placeholder="YYYY-MM-DD"
        pattern="\d{4}-\d{2}-\d{2}"
        :disabled="status === 'loading'"
        class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none disabled:bg-slate-100"
      >
      <p class="mt-1 text-xs text-slate-400">Format: YYYY-MM-DD. Must be today or a future date.</p>
    </div>

    <p v-if="status === 'error'" class="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
      {{ errorMessage }}
    </p>

    <p
      v-if="status === 'success'"
      class="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700"
      role="status"
    >
      Task created successfully.
    </p>

    <button
      type="submit"
      :disabled="status === 'loading'"
      class="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
    >
      {{ status === 'loading' ? 'Creating…' : 'Create task' }}
    </button>
  </form>
</template>
