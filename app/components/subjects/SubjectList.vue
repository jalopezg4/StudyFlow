<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import SubjectEditForm from '~/components/subjects/SubjectEditForm.vue'

interface Subject {
  id: string
  name: string
  description: string | null
  createdAt: string
  taskCount: number
}

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

const subjects = ref<Subject[]>([])
const status = ref<Status>('idle')
const errorMessage = ref('')
const editingId = ref<string | null>(null)
const confirmingDeleteId = ref<string | null>(null)
const deletingId = ref<string | null>(null)
const deleteErrors = reactive<Record<string, string>>({})
const expandedSubjectId = ref<string | null>(null)
const subjectTasks = reactive<Record<string, StudyTask[]>>({})
const taskStatusBySubject = reactive<Record<string, Status>>({})
const taskErrorBySubject = reactive<Record<string, string>>({})

function startEditing(id: string) {
  editingId.value = id
}

function cancelEditing() {
  editingId.value = null
}

function handleUpdated(updated: Subject) {
  const index = subjects.value.findIndex((subject) => subject.id === updated.id)
  if (index !== -1) {
    subjects.value[index] = updated
  }
  editingId.value = null
}

function extractErrorMessage(error: unknown): string {
  const fetchError = error as { data?: { error?: { message?: string } } }
  return fetchError.data?.error?.message ?? 'Could not load subjects. Please try again.'
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
    await $fetch(`/api/subjects/${id}`, { method: 'DELETE' })
    subjects.value = subjects.value.filter((subject) => subject.id !== id)
    if (expandedSubjectId.value === id) {
      expandedSubjectId.value = null
    }
    subjectTasks[id] = []
    taskStatusBySubject[id] = 'idle'
    taskErrorBySubject[id] = ''
    confirmingDeleteId.value = null
    deleteErrors[id] = ''
  } catch (error) {
    const fetchError = error as { data?: { error?: { message?: string } } }
    deleteErrors[id] = fetchError.data?.error?.message
      ?? 'Could not delete the subject. Please try again.'
  } finally {
    deletingId.value = null
  }
}

function extractTaskErrorMessage(error: unknown): string {
  const fetchError = error as { data?: { error?: { message?: string } } }
  return fetchError.data?.error?.message ?? 'Could not load tasks for this subject. Please try again.'
}

async function loadTasksForSubject(subjectId: string) {
  taskStatusBySubject[subjectId] = 'loading'
  taskErrorBySubject[subjectId] = ''

  try {
    const response = await $fetch<{ status: string, tasks: StudyTask[] }>('/api/tasks', {
      query: { subjectId }
    })
    subjectTasks[subjectId] = response.tasks
    taskStatusBySubject[subjectId] = 'success'
  } catch (error) {
    taskStatusBySubject[subjectId] = 'error'
    taskErrorBySubject[subjectId] = extractTaskErrorMessage(error)
  }
}

async function toggleSubjectTasks(subjectId: string) {
  if (expandedSubjectId.value === subjectId) {
    expandedSubjectId.value = null
    return
  }

  expandedSubjectId.value = subjectId
  await loadTasksForSubject(subjectId)
}

async function retryLoadSubjectTasks(subjectId: string) {
  await loadTasksForSubject(subjectId)
}

async function loadSubjects() {
  status.value = 'loading'
  errorMessage.value = ''

  try {
    const response = await $fetch<{ status: string, subjects: Subject[] }>('/api/subjects')
    subjects.value = response.subjects
    status.value = 'success'
  } catch (error) {
    status.value = 'error'
    errorMessage.value = extractErrorMessage(error)
  }
}

onMounted(loadSubjects)

defineExpose({ refresh: loadSubjects })
</script>

<template>
  <div class="flex flex-col gap-3">
    <h2 class="text-lg font-bold tracking-tight text-slate-900">My subjects</h2>

    <p v-if="status === 'loading'" class="text-sm text-slate-600">
      Loading subjects…
    </p>

    <p v-else-if="status === 'error'" class="text-sm text-red-700" role="alert">
      {{ errorMessage }}
    </p>

    <p v-else-if="subjects.length === 0" class="text-sm text-slate-600">
      You don't have any subjects yet.
    </p>

    <ul v-else class="flex flex-col gap-2">
      <li
        v-for="subject in subjects"
        :key="subject.id"
        class="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm transition-shadow hover:shadow-md"
      >
        <SubjectEditForm
          v-if="editingId === subject.id"
          :subject="subject"
          @updated="handleUpdated"
          @cancel="cancelEditing"
        />
        <div v-else class="flex flex-col gap-2">
          <div class="flex items-start justify-between gap-3">
            <div>
              <strong class="font-medium">{{ subject.name }}</strong>
              <span v-if="subject.description"> — {{ subject.description }}</span>
            </div>
            <div class="flex shrink-0 gap-3">
              <button
                type="button"
                class="rounded-full px-2.5 py-1 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                @click="toggleSubjectTasks(subject.id)"
              >
                {{ expandedSubjectId === subject.id ? 'Hide tasks' : 'View tasks' }}
              </button>
              <button
                type="button"
                class="rounded-full px-2.5 py-1 text-xs font-semibold text-indigo-600 transition-colors hover:bg-indigo-50"
                @click="startEditing(subject.id)"
              >
                Edit
              </button>
              <button
                v-if="confirmingDeleteId !== subject.id"
                type="button"
                class="rounded-full px-2.5 py-1 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
                @click="requestDelete(subject.id)"
              >
                Delete
              </button>
            </div>
          </div>

          <div v-if="confirmingDeleteId === subject.id" class="flex flex-col gap-1">
            <p v-if="subject.taskCount > 0" class="text-sm font-medium text-red-700">
              This subject has {{ subject.taskCount }} task{{ subject.taskCount === 1 ? '' : 's' }}. Deleting it will also delete {{ subject.taskCount === 1 ? 'that task' : 'all of them' }}. This action cannot be undone.
            </p>
            <p v-else class="text-sm text-slate-700">Delete this subject? This action cannot be undone.</p>
            <div class="flex gap-2">
              <button
                type="button"
                :disabled="deletingId === subject.id"
                class="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-red-500 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                @click="confirmDelete(subject.id)"
              >
                {{ deletingId === subject.id ? 'Deleting…' : 'Confirm delete' }}
              </button>
              <button
                type="button"
                :disabled="deletingId === subject.id"
                class="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-150 hover:border-slate-400 hover:bg-slate-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                @click="cancelDelete(subject.id)"
              >
                Cancel
              </button>
            </div>
            <p v-if="deleteErrors[subject.id]" class="text-sm text-red-700" role="alert">
              {{ deleteErrors[subject.id] }}
            </p>
          </div>

          <div
            v-if="expandedSubjectId === subject.id"
            class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
          >
            <p v-if="taskStatusBySubject[subject.id] === 'loading'" class="text-sm text-slate-600">
              Loading tasks…
            </p>

            <div v-else-if="taskStatusBySubject[subject.id] === 'error'" class="flex flex-col gap-2">
              <p class="text-sm text-red-700" role="alert">
                {{ taskErrorBySubject[subject.id] }}
              </p>
              <button
                type="button"
                class="w-fit rounded-full px-2.5 py-1 text-xs font-semibold text-indigo-600 transition-colors hover:bg-indigo-50"
                @click="retryLoadSubjectTasks(subject.id)"
              >
                Retry
              </button>
            </div>

            <p v-else-if="(subjectTasks[subject.id] ?? []).length === 0" class="text-sm text-slate-600">
              No tasks for this subject yet.
            </p>

            <ul v-else class="flex flex-col gap-1.5">
              <li
                v-for="task in subjectTasks[subject.id]"
                :key="task.id"
                class="flex items-center justify-between gap-3 rounded-md bg-white px-2.5 py-2 text-sm text-slate-700 ring-1 ring-slate-200"
              >
                <div>
                  <strong class="font-medium" :class="{ 'text-slate-400 line-through': task.status === 'completed' }">{{ task.title }}</strong>
                  <span v-if="task.dueDate" class="ml-2 text-xs text-slate-500">Due {{ task.dueDate }}</span>
                  <span v-if="task.description" class="ml-2 text-xs text-slate-500">- {{ task.description }}</span>
                </div>
                <span
                  class="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset"
                  :class="task.status === 'completed' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : 'bg-amber-50 text-amber-700 ring-amber-600/20'"
                >
                  {{ task.status === 'completed' ? 'Completed' : 'Pending' }}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>
