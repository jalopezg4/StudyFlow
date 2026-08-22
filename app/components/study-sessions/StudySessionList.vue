<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

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

const subjectNames = computed(() => new Map(subjects.value.map((subject) => [subject.id, subject.name])))
const taskTitles = computed(() => new Map(tasks.value.map((task) => [task.id, task.title])))

function beginEdit(session: StudySession) {
  editingId.value = session.id
  editDuration.value = session.durationMinutes
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

async function removeSession(session: StudySession) {
  if (!window.confirm('Delete this study session?')) return
  try {
    await $fetch(`/api/study-sessions/${session.id}`, { method: 'DELETE' })
    sessions.value = sessions.value.filter((item) => item.id !== session.id)
  } catch (error) {
    errorMessage.value = extractErrorMessage(error)
  }
}

onMounted(loadSessions)
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
        <div v-if="editingId === session.id" class="flex flex-wrap items-end gap-2">
          <label :for="`edit-session-${session.id}`" class="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Duration (minutes)
            <input :id="`edit-session-${session.id}`" v-model.number="editDuration" type="number" min="1" max="1440" step="1" class="w-32 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
          </label>
          <button type="button" class="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white" @click="saveEdit(session)">Save</button>
          <button type="button" class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700" @click="editingId = null">Cancel</button>
        </div>
        <div v-else class="flex flex-wrap items-center justify-between gap-3 text-sm">
          <div>
            <span class="font-semibold text-slate-900">{{ session.durationMinutes }} minutes</span>
            <span class="ml-2 text-slate-500">{{ subjectNames.get(session.subjectId) ?? 'Unknown subject' }}</span>
            <span v-if="session.taskId" class="ml-2 text-slate-500">· {{ taskTitles.get(session.taskId) ?? 'Unknown task' }}</span>
          </div>
          <div class="flex gap-3">
            <button type="button" class="font-semibold text-indigo-600 hover:text-indigo-500" @click="beginEdit(session)">Edit</button>
            <button type="button" class="font-semibold text-red-700 hover:text-red-600" @click="removeSession(session)">Delete</button>
          </div>
        </div>
      </li>
    </ul>
  </section>
</template>
