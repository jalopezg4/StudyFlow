<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

interface StudySession {
  id: string
  subjectId: string
  taskId: string | null
  durationMinutes: number
  createdAt: string
}

interface Subject { id: string; name: string }
interface StudyTask { id: string; title: string }

const sessions = ref<StudySession[]>([])
const subjects = ref<Subject[]>([])
const tasks = ref<StudyTask[]>([])
const editingId = ref<string | null>(null)
const editDuration = ref(0)
const status = ref<'loading' | 'loaded' | 'error'>('loading')
const errorMessage = ref('')
const confirmingDeleteId = ref<string | null>(null)
const deletingId = ref<string | null>(null)
const deleteErrors = reactive<Record<string, string>>({})

const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })

const subjectNames = computed(() => new Map(subjects.value.map((subject) => [subject.id, subject.name])))
const taskTitles = computed(() => new Map(tasks.value.map((task) => [task.id, task.title])))

function beginEdit(session: StudySession) {
  editingId.value = session.id
  editDuration.value = session.durationMinutes
  errorMessage.value = ''
}

function formatRecordedAt(createdAt: string): string {
  const date = new Date(createdAt)
  return Number.isNaN(date.getTime()) ? '' : dateFormatter.format(date)
}

function extractErrorMessage(error: unknown): string {
  const fetchError = error as { data?: { error?: { message?: string } } }
  return fetchError.data?.error?.message ?? 'Could not update the study session.'
}

async function loadSessions() {
  status.value = 'loading'
  try {
    const [sessionResponse, subjectResponse, taskResponse] = await Promise.all([
      $fetch<{ sessions: StudySession[] }>('/api/study-sessions'),
      $fetch<{ subjects: Subject[] }>('/api/subjects'),
      $fetch<{ tasks: StudyTask[] }>('/api/tasks')
    ])
    sessions.value = sessionResponse.sessions
    subjects.value = subjectResponse.subjects
    tasks.value = taskResponse.tasks
    status.value = 'loaded'
  } catch (error) {
    status.value = 'error'
    errorMessage.value = extractErrorMessage(error)
  }
}

async function saveEdit(session: StudySession) {
  errorMessage.value = ''
  try {
    const response = await $fetch<{ studySession: StudySession }>(`/api/study-sessions/${session.id}`, {
      method: 'PATCH',
      body: { durationMinutes: editDuration.value }
    })
    session.durationMinutes = response.studySession.durationMinutes
    editingId.value = null
  } catch (error) {
    errorMessage.value = extractErrorMessage(error)
  }
}

function requestDelete(id: string) {
  confirmingDeleteId.value = id
  deleteErrors[id] = ''
}

function cancelDelete(id: string) {
  confirmingDeleteId.value = null
  deleteErrors[id] = ''
}

async function confirmDelete(id: string) {
  deletingId.value = id

  try {
    await $fetch(`/api/study-sessions/${id}`, { method: 'DELETE' })
    sessions.value = sessions.value.filter((item) => item.id !== id)
    confirmingDeleteId.value = null
    deleteErrors[id] = ''
  } catch (error) {
    deleteErrors[id] = extractErrorMessage(error)
  } finally {
    deletingId.value = null
  }
}

onMounted(loadSessions)

defineExpose({ refresh: loadSessions })
</script>

<template>
  <section class="mt-8 border-t border-slate-200 pt-6" aria-labelledby="sessions-heading">
    <div class="flex items-center justify-between gap-3">
      <h2 id="sessions-heading" class="text-lg font-semibold text-slate-900">Recorded sessions</h2>
      <span class="text-xs font-medium text-slate-500">{{ sessions.length }} total</span>
    </div>
    <p v-if="status === 'loading'" class="mt-3 text-sm text-slate-600">Loading sessions…</p>
    <p v-else-if="status === 'error'" class="mt-3 text-sm text-red-700" role="alert">{{ errorMessage }}</p>
    <p v-else-if="sessions.length === 0" class="mt-3 text-sm text-slate-600">No recorded sessions yet.</p>
    <ul v-else class="mt-3 flex flex-col gap-2">
      <li v-for="session in sessions" :key="session.id" class="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
        <div v-if="editingId === session.id" class="flex flex-col gap-2">
          <div class="flex flex-wrap items-end gap-2">
            <label :for="`edit-session-${session.id}`" class="flex flex-col gap-1 text-xs font-medium text-slate-600">
              Duration (minutes)
              <input :id="`edit-session-${session.id}`" v-model.number="editDuration" type="number" min="1" max="1440" step="1" class="w-32 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
            </label>
            <button type="button" class="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white" @click="saveEdit(session)">Save</button>
            <button type="button" class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700" @click="editingId = null">Cancel</button>
          </div>
          <p v-if="errorMessage" class="text-sm text-red-700" role="alert">{{ errorMessage }}</p>
        </div>
        <div v-else class="flex flex-col gap-2">
          <div class="flex flex-wrap items-center justify-between gap-3 text-sm">
            <div>
              <span class="font-semibold text-slate-900">{{ session.durationMinutes }} minutes</span>
              <span class="ml-2 text-slate-500">{{ subjectNames.get(session.subjectId) ?? 'Unknown subject' }}</span>
              <span v-if="session.taskId" class="ml-2 text-slate-500">· {{ taskTitles.get(session.taskId) ?? 'Unknown task' }}</span>
              <span class="ml-2 text-slate-400">· Recorded {{ formatRecordedAt(session.createdAt) }}</span>
            </div>
            <div v-if="confirmingDeleteId !== session.id" class="flex gap-3">
              <button type="button" class="font-semibold text-indigo-600 hover:text-indigo-500" @click="beginEdit(session)">Edit</button>
              <button type="button" class="font-semibold text-red-700 hover:text-red-600" @click="requestDelete(session.id)">Delete</button>
            </div>
          </div>

          <div v-if="confirmingDeleteId === session.id" class="flex flex-col gap-1">
            <p class="text-sm text-slate-700">Delete this study session? This action cannot be undone.</p>
            <div class="flex gap-2">
              <button
                type="button"
                :disabled="deletingId === session.id"
                class="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-red-500 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                @click="confirmDelete(session.id)"
              >
                {{ deletingId === session.id ? 'Deleting…' : 'Confirm delete' }}
              </button>
              <button
                type="button"
                :disabled="deletingId === session.id"
                class="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-150 hover:border-slate-400 hover:bg-slate-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                @click="cancelDelete(session.id)"
              >
                Cancel
              </button>
            </div>
            <p v-if="deleteErrors[session.id]" class="text-sm text-red-700" role="alert">
              {{ deleteErrors[session.id] }}
            </p>
          </div>
        </div>
      </li>
    </ul>
  </section>
</template>
