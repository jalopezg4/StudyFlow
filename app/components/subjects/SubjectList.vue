<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import SubjectEditForm from '~/components/subjects/SubjectEditForm.vue'

interface Subject {
  id: string
  name: string
  description: string | null
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
    <h2 class="text-lg font-medium text-slate-900">My subjects</h2>

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
        class="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700"
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
                class="text-sm font-medium text-slate-600 underline"
                @click="startEditing(subject.id)"
              >
                Edit
              </button>
              <button
                v-if="confirmingDeleteId !== subject.id"
                type="button"
                class="text-sm font-medium text-red-700 underline"
                @click="requestDelete(subject.id)"
              >
                Delete
              </button>
            </div>
          </div>

          <div v-if="confirmingDeleteId === subject.id" class="flex flex-col gap-1">
            <p class="text-sm text-slate-700">Delete this subject? This action cannot be undone.</p>
            <div class="flex gap-2">
              <button
                type="button"
                :disabled="deletingId === subject.id"
                class="rounded-md bg-red-700 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
                @click="confirmDelete(subject.id)"
              >
                {{ deletingId === subject.id ? 'Deleting…' : 'Confirm delete' }}
              </button>
              <button
                type="button"
                :disabled="deletingId === subject.id"
                class="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 disabled:opacity-60"
                @click="cancelDelete(subject.id)"
              >
                Cancel
              </button>
            </div>
            <p v-if="deleteErrors[subject.id]" class="text-sm text-red-700" role="alert">
              {{ deleteErrors[subject.id] }}
            </p>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>
