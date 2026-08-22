<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

interface Subject {
  id: string
  name: string
}

interface StudyTask {
  id: string
  subjectId: string
  title: string
  status: 'pending' | 'completed'
}

interface CreatedStudySession {
  id: string
  subjectId: string
  taskId: string | null
  durationMinutes: number
  createdAt: string
}

type Status = 'idle' | 'loading' | 'success' | 'error'

const emit = defineEmits<{
  created: [studySession: CreatedStudySession]
}>()

const form = reactive({
  subjectId: '',
  taskId: '',
  durationMinutes: 30
})
const subjects = ref<Subject[]>([])
const tasks = ref<StudyTask[]>([])
const loadStatus = ref<'loading' | 'loaded' | 'error'>('loading')
const status = ref<Status>('idle')
const errorMessage = ref('')
const createdSession = ref<CreatedStudySession | null>(null)

const availableTasks = computed(() => tasks.value.filter((task) => task.subjectId === form.subjectId))

function extractErrorMessage(error: unknown): string {
  const fetchError = error as { data?: { error?: { message?: string } } }
  return fetchError.data?.error?.message ?? 'Could not record the study session. Please try again.'
}

function validateDuration(minutes: number): string | null {
  if (!Number.isInteger(minutes)) return 'Duration must be a whole number of minutes.'
  if (minutes < 1 || minutes > 1440) return 'Duration must be between 1 and 1,440 minutes (24 hours).'
  return null
}

async function loadResources() {
  loadStatus.value = 'loading'

  try {
    const [subjectResponse, taskResponse] = await Promise.all([
      $fetch<{ subjects: Subject[] }>('/api/subjects'),
      $fetch<{ tasks: StudyTask[] }>('/api/tasks')
    ])
    subjects.value = subjectResponse.subjects
    tasks.value = taskResponse.tasks
    loadStatus.value = 'loaded'
  } catch {
    loadStatus.value = 'error'
  }
}

function handleSubjectChange() {
  form.taskId = ''
}

async function handleSubmit() {
  const durationError = validateDuration(form.durationMinutes)
  if (durationError) {
    status.value = 'error'
    errorMessage.value = durationError
    return
  }

  status.value = 'loading'
  errorMessage.value = ''
  createdSession.value = null

  try {
    const response = await $fetch<{ status: string, studySession: CreatedStudySession }>('/api/study-sessions', {
      method: 'POST',
      body: {
        subjectId: form.subjectId,
        taskId: form.taskId || undefined,
        durationMinutes: form.durationMinutes
      }
    })
    createdSession.value = response.studySession
    status.value = 'success'
    form.taskId = ''
    emit('created', response.studySession)
  } catch (error) {
    status.value = 'error'
    errorMessage.value = extractErrorMessage(error)
  }
}

onMounted(loadResources)
</script>

<template>
  <form novalidate class="flex flex-col gap-4" @submit.prevent="handleSubmit">
    <p v-if="loadStatus === 'error'" class="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
      Could not load your subjects and tasks. Please try again.
    </p>

    <div>
      <label for="session-subject" class="block text-sm font-medium text-slate-700">Subject</label>
      <select
        id="session-subject"
        v-model="form.subjectId"
        required
        :disabled="status === 'loading' || loadStatus !== 'loaded'"
        class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-100 disabled:text-slate-400"
        @change="handleSubjectChange"
      >
        <option value="" disabled>Choose a subject</option>
        <option v-for="subject in subjects" :key="subject.id" :value="subject.id">
          {{ subject.name }}
        </option>
      </select>
    </div>

    <div>
      <label for="session-task" class="block text-sm font-medium text-slate-700">
        Task <span class="font-normal text-slate-400">(optional)</span>
      </label>
      <select
        id="session-task"
        v-model="form.taskId"
        :disabled="status === 'loading' || !form.subjectId"
        class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-100 disabled:text-slate-400"
      >
        <option value="">General study for this subject</option>
        <option v-for="task in availableTasks" :key="task.id" :value="task.id">
          {{ task.title }}{{ task.status === 'completed' ? ' (completed)' : '' }}
        </option>
      </select>
    </div>

    <div>
      <label for="session-duration" class="block text-sm font-medium text-slate-700">Duration (minutes)</label>
      <input
        id="session-duration"
        v-model.number="form.durationMinutes"
        type="number"
        min="1"
        max="1440"
        step="1"
        required
        :disabled="status === 'loading'"
        class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-100 disabled:text-slate-400"
      >
    </div>

    <p v-if="status === 'error'" class="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
      {{ errorMessage }}
    </p>

    <p v-if="status === 'success'" class="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700" role="status">
      Study session recorded: {{ createdSession?.durationMinutes }} minutes.
    </p>

    <button
      type="submit"
      :disabled="status === 'loading' || !form.subjectId || loadStatus !== 'loaded'"
      class="w-full inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-indigo-500 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
    >
      {{ status === 'loading' ? 'Recording…' : 'Record study session' }}
    </button>
  </form>
</template>
