<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import TaskEditForm from '~/components/tasks/TaskEditForm.vue'

interface StudyTask {
  id: string
  subjectId: string
  title: string
  description: string | null
  dueDate: string | null
  status: 'pending' | 'completed'
  createdAt: string
}

type Status = 'idle' | 'loading' | 'success' | 'error'

const tasks = ref<StudyTask[]>([])
const status = ref<Status>('idle')
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
  editingId.value = null
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

async function loadTasks() {
  status.value = 'loading'
  errorMessage.value = ''

  try {
    const response = await $fetch<{ status: string, tasks: StudyTask[] }>('/api/tasks')
    tasks.value = response.tasks
    status.value = 'success'
  } catch (error) {
    status.value = 'error'
    errorMessage.value = extractErrorMessage(error)
  }
}

onMounted(loadTasks)

defineExpose({ refresh: loadTasks })
</script>

<template>
  <div class="flex flex-col gap-3">
    <h2 class="text-lg font-medium text-slate-900">My tasks</h2>

    <p v-if="status === 'loading'" class="text-sm text-slate-600">
      Loading tasks…
    </p>

    <p v-else-if="status === 'error'" class="text-sm text-red-700" role="alert">
      {{ errorMessage }}
    </p>

    <p v-else-if="tasks.length === 0" class="text-sm text-slate-600">
      You don't have any tasks yet.
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
