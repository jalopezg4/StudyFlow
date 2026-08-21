<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import TaskEditForm from '~/components/tasks/TaskEditForm.vue'

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

interface Subject {
  id: string
  name: string
}

type Status = 'idle' | 'loading' | 'success' | 'error'

const tasks = ref<StudyTask[]>([])
const status = ref<Status>('idle')
const subjects = ref<Subject[]>([])
const filters = reactive({
  status: '' as '' | 'pending' | 'completed',
  subjectId: '',
  sortBy: '' as '' | 'dueDate' | 'createdAt' | 'title',
  sortDir: 'asc' as 'asc' | 'desc'
})
const errorMessage = ref('')
const editingId = ref<string | null>(null)
const confirmingDeleteId = ref<string | null>(null)
const deletingId = ref<string | null>(null)
const togglingId = ref<string | null>(null)
const deleteErrors = reactive<Record<string, string>>({})
const toggleErrors = reactive<Record<string, string>>({})

function startEditing(id: string) {
  editingId.value = id
}

function cancelEditing() {
  editingId.value = null
}

function handleUpdated(updated: StudyTask) {
  const index = tasks.value.findIndex((task) => task.id === updated.id)
  if (index !== -1) {
    tasks.value[index] = updated
  }
  if (editingId.value === updated.id) {
    editingId.value = null
  }
}

function extractErrorMessage(error: unknown): string {
  const fetchError = error as { data?: { error?: { message?: string } } }
  return fetchError.data?.error?.message ?? 'Could not load tasks. Please try again.'
}

async function toggleStatus(task: StudyTask) {
  togglingId.value = task.id
  toggleErrors[task.id] = ''
  const nextStatus = task.status === 'pending' ? 'completed' : 'pending'

  try {
    const response = await $fetch<{ status: string, task: StudyTask }>(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      body: { status: nextStatus }
    })
    handleUpdated(response.task)
  } catch (error) {
    const fetchError = error as { data?: { error?: { message?: string } } }
    toggleErrors[task.id] = fetchError.data?.error?.message ?? 'Could not update the task status. Please try again.'
  } finally {
    togglingId.value = null
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
    await $fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    tasks.value = tasks.value.filter((task) => task.id !== id)
    confirmingDeleteId.value = null
    deleteErrors[id] = ''
  } catch (error) {
    const fetchError = error as { data?: { error?: { message?: string } } }
    deleteErrors[id] = fetchError.data?.error?.message ?? 'Could not delete the task. Please try again.'
  } finally {
    deletingId.value = null
  }
}

async function loadSubjectsForFilter() {
  try {
    const response = await $fetch<{ status: string, subjects: Subject[] }>('/api/subjects')
    subjects.value = response.subjects
  } catch {
    // The subject filter simply offers no options; the task list's own error
    // state below already covers surfacing a hard failure to the student.
  }
}

async function loadTasks() {
  status.value = 'loading'
  errorMessage.value = ''

  const query: Record<string, string> = {}
  if (filters.status) query.status = filters.status
  if (filters.subjectId) query.subjectId = filters.subjectId
  if (filters.sortBy) {
    query.sortBy = filters.sortBy
    query.sortDir = filters.sortDir
  }

  try {
    const response = await $fetch<{ status: string, tasks: StudyTask[] }>('/api/tasks', { query })
    tasks.value = response.tasks
    status.value = 'success'
  } catch (error) {
    status.value = 'error'
    errorMessage.value = extractErrorMessage(error)
  }
}

onMounted(() => {
  loadSubjectsForFilter()
  loadTasks()
})

defineExpose({ refresh: loadTasks })
</script>

<template>
  <div class="flex flex-col gap-3">
    <h2 class="text-lg font-medium text-slate-900">My tasks</h2>

    <div class="flex flex-wrap items-end gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
      <div>
        <label for="filter-status" class="block text-xs font-medium text-slate-600">Status</label>
        <select
          id="filter-status"
          v-model="filters.status"
          class="mt-1 rounded-md border border-slate-300 px-2 py-1 text-sm"
          @change="loadTasks"
        >
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div>
        <label for="filter-subject" class="block text-xs font-medium text-slate-600">Subject</label>
        <select
          id="filter-subject"
          v-model="filters.subjectId"
          class="mt-1 rounded-md border border-slate-300 px-2 py-1 text-sm"
          @change="loadTasks"
        >
          <option value="">All</option>
          <option v-for="subject in subjects" :key="subject.id" :value="subject.id">
            {{ subject.name }}
          </option>
        </select>
      </div>

      <div>
        <label for="filter-sort" class="block text-xs font-medium text-slate-600">Sort by</label>
        <select
          id="filter-sort"
          v-model="filters.sortBy"
          class="mt-1 rounded-md border border-slate-300 px-2 py-1 text-sm"
          @change="loadTasks"
        >
          <option value="">Default (newest first)</option>
          <option value="dueDate">Due date</option>
          <option value="createdAt">Created date</option>
          <option value="title">Title</option>
        </select>
      </div>

      <div v-if="filters.sortBy">
        <label for="filter-direction" class="block text-xs font-medium text-slate-600">Direction</label>
        <select
          id="filter-direction"
          v-model="filters.sortDir"
          class="mt-1 rounded-md border border-slate-300 px-2 py-1 text-sm"
          @change="loadTasks"
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>
    </div>

    <p v-if="status === 'loading'" class="text-sm text-slate-600">
      Loading tasks…
    </p>

    <p v-else-if="status === 'error'" class="text-sm text-red-700" role="alert">
      {{ errorMessage }}
    </p>

    <p v-else-if="tasks.length === 0" class="text-sm text-slate-600">
      {{ filters.status || filters.subjectId
        ? 'No tasks match these filters.'
        : "You don't have any tasks yet." }}
    </p>

    <ul v-else class="flex flex-col gap-2">
      <li
        v-for="task in tasks"
        :key="task.id"
        class="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700"
      >
        <TaskEditForm
          v-if="editingId === task.id"
          :task="task"
          @updated="handleUpdated"
          @cancel="cancelEditing"
        />
        <div v-else class="flex flex-col gap-2">
          <div class="flex items-start justify-between gap-3">
            <div>
              <span class="mr-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                {{ task.subjectName || 'Unknown subject' }}
              </span>
              <strong
                class="font-medium"
                :class="{ 'text-slate-400 line-through': task.status === 'completed' }"
              >{{ task.title }}</strong>
              <span v-if="task.description"> — {{ task.description }}</span>
              <span v-if="task.dueDate" class="ml-2 text-xs text-slate-400">Due {{ task.dueDate }}</span>
              <span
                class="ml-2 rounded-full px-2 py-0.5 text-xs font-medium"
                :class="task.status === 'completed' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'"
              >
                {{ task.status === 'completed' ? 'Completed' : 'Pending' }}
              </span>
            </div>
            <div class="flex shrink-0 gap-3">
              <button
                type="button"
                :disabled="togglingId === task.id"
                class="text-sm font-medium text-slate-600 underline disabled:opacity-60"
                @click="toggleStatus(task)"
              >
                {{ task.status === 'pending' ? 'Mark complete' : 'Mark pending' }}
              </button>
              <button
                type="button"
                class="text-sm font-medium text-slate-600 underline"
                @click="startEditing(task.id)"
              >
                Edit
              </button>
              <button
                v-if="confirmingDeleteId !== task.id"
                type="button"
                class="text-sm font-medium text-red-700 underline"
                @click="requestDelete(task.id)"
              >
                Delete
              </button>
            </div>
          </div>

          <p v-if="toggleErrors[task.id]" class="text-sm text-red-700" role="alert">
            {{ toggleErrors[task.id] }}
          </p>

          <div v-if="confirmingDeleteId === task.id" class="flex flex-col gap-1">
            <p class="text-sm text-slate-700">Delete this task? This action cannot be undone.</p>
            <div class="flex gap-2">
              <button
                type="button"
                :disabled="deletingId === task.id"
                class="rounded-md bg-red-700 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
                @click="confirmDelete(task.id)"
              >
                {{ deletingId === task.id ? 'Deleting…' : 'Confirm delete' }}
              </button>
              <button
                type="button"
                :disabled="deletingId === task.id"
                class="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 disabled:opacity-60"
                @click="cancelDelete(task.id)"
              >
                Cancel
              </button>
            </div>
            <p v-if="deleteErrors[task.id]" class="text-sm text-red-700" role="alert">
              {{ deleteErrors[task.id] }}
            </p>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>
