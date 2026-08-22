<script setup lang="ts">
import { reactive, ref } from 'vue'

interface Subject {
  id: string
  name: string
  description: string | null
  createdAt: string
  taskCount: number
}

const props = defineProps<{ subject: Subject }>()

const emit = defineEmits<{
  updated: [subject: Subject]
  cancel: []
}>()

const NAME_MAX_LENGTH = 100
const DESCRIPTION_MAX_LENGTH = 500

const form = reactive({
  name: props.subject.name,
  description: props.subject.description ?? ''
})

type Status = 'idle' | 'loading' | 'error'

const status = ref<Status>('idle')
const errorMessage = ref('')

function validate(): string | null {
  const trimmedName = form.name.trim()

  if (trimmedName.length === 0) {
    return 'Name is required.'
  }

  if (trimmedName.length > NAME_MAX_LENGTH) {
    return `Name cannot exceed ${NAME_MAX_LENGTH} characters.`
  }

  if (form.description.trim().length > DESCRIPTION_MAX_LENGTH) {
    return `Description cannot exceed ${DESCRIPTION_MAX_LENGTH} characters.`
  }

  return null
}

function extractErrorMessage(error: unknown): string {
  const fetchError = error as { data?: { error?: { message?: string } } }
  return fetchError.data?.error?.message ?? 'Could not update the subject. Please try again.'
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
    const response = await $fetch<{ status: string, subject: Subject }>(`/api/subjects/${props.subject.id}`, {
      method: 'PATCH',
      body: {
        name: form.name.trim(),
        description: form.description.trim() || undefined
      }
    })

    status.value = 'idle'
    emit('updated', response.subject)
  } catch (error) {
    status.value = 'error'
    errorMessage.value = extractErrorMessage(error)
  }
}
</script>

<template>
  <form novalidate class="flex flex-col gap-3" @submit.prevent="handleSubmit">
    <div class="flex flex-col gap-1">
      <label :for="`subject-edit-name-${subject.id}`" class="text-sm font-medium text-slate-700">Name</label>
      <input
        :id="`subject-edit-name-${subject.id}`"
        v-model="form.name"
        type="text"
        :maxlength="NAME_MAX_LENGTH"
        :disabled="status === 'loading'"
        required
        class="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-100 disabled:text-slate-400"
      >
      <p class="text-xs text-slate-400">{{ form.name.length }}/{{ NAME_MAX_LENGTH }}</p>
    </div>

    <div class="flex flex-col gap-1">
      <label :for="`subject-edit-description-${subject.id}`" class="text-sm font-medium text-slate-700">Description (optional)</label>
      <textarea
        :id="`subject-edit-description-${subject.id}`"
        v-model="form.description"
        :maxlength="DESCRIPTION_MAX_LENGTH"
        :disabled="status === 'loading'"
        class="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-100 disabled:text-slate-400"
      />
      <p class="text-xs text-slate-400">{{ form.description.length }}/{{ DESCRIPTION_MAX_LENGTH }}</p>
    </div>

    <div class="flex gap-2">
      <button
        type="submit"
        :disabled="status === 'loading'"
        class="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-indigo-500 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
      >
        {{ status === 'loading' ? 'Saving…' : 'Save' }}
      </button>
      <button
        type="button"
        :disabled="status === 'loading'"
        class="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-150 hover:border-slate-400 hover:bg-slate-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
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
