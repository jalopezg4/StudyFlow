<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import DatePicker from '~/components/DatePicker.vue'

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

// Clears a stale 'success'/'error' message as soon as the student actually
// edits the form again, so it never lingers into the next attempt at a new
// entry. Tied to the real input event (not a reactive watch on form.title/
// description) because the programmatic reset after a successful submit
// below also sets those same fields to '' - a watch can't tell that apart
// from the student clearing the field themselves, since Vue batches the
// watcher callback to run after that reset has already landed.
function clearStaleStatus() {
  if (status.value === 'success' || status.value === 'error') {
    status.value = 'idle'
    errorMessage.value = ''
  }
}

// UTC, to match the server's own clock exactly (server/utils/tasks/schemas.ts's
// isPastDate) - using local time here could disagree with the server by a day
// depending on the browser's timezone and time of day.
const today = new Date()
const todayStr = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, '0')}-${String(today.getUTCDate()).padStart(2, '0')}`

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

    form.title = ''
    form.description = ''
    form.dueDate = ''
    status.value = 'success'
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
        class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-100 disabled:text-slate-400"
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
        class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-100 disabled:text-slate-400"
        @input="clearStaleStatus"
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
        class="mt-1 w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-100 disabled:text-slate-400"
        @input="clearStaleStatus"
      />
      <p class="mt-1 text-xs text-slate-400">
        {{ form.description.length }}/{{ DESCRIPTION_MAX_LENGTH }}
      </p>
    </div>

    <div>
      <label for="task-due-date" class="block text-sm font-medium text-slate-700">
        Due date <span class="font-normal text-slate-400">(optional)</span>
      </label>
      <DatePicker
        id="task-due-date"
        v-model="form.dueDate"
        :min-date="todayStr"
        :disabled="status === 'loading'"
        placeholder="Select a date"
        class="mt-1"
      />
      <p class="mt-1 text-xs text-slate-400">Past dates are disabled — a task can't be due before today.</p>
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
      class="w-full inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-indigo-500 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
    >
      {{ status === 'loading' ? 'Creating…' : 'Create task' }}
    </button>
  </form>
</template>
