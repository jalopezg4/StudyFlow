<script setup lang="ts">
import { reactive, ref } from 'vue'

interface CreatedSubject {
  id: string
  name: string
  description: string | null
  createdAt: string
}

const emit = defineEmits<{
  created: [subject: CreatedSubject]
}>()

const NAME_MAX_LENGTH = 100
const DESCRIPTION_MAX_LENGTH = 500

const form = reactive({
  name: '',
  description: ''
})

type Status = 'idle' | 'loading' | 'success' | 'error'

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
  return fetchError.data?.error?.message ?? 'Could not create the subject. Please try again.'
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
    const response = await $fetch<{ status: string, subject: CreatedSubject }>('/api/subjects', {
      method: 'POST',
      body: {
        name: form.name.trim(),
        description: form.description.trim() || undefined
      }
    })

    status.value = 'success'
    form.name = ''
    form.description = ''
    emit('created', response.subject)
  } catch (error) {
    status.value = 'error'
    errorMessage.value = extractErrorMessage(error)
  }
}
</script>

<template>
  <form novalidate class="flex flex-col gap-4" @submit.prevent="handleSubmit">
    <div>
      <label for="subject-name" class="block text-sm font-medium text-slate-700">Name</label>
      <input
        id="subject-name"
        v-model="form.name"
        type="text"
        placeholder="e.g. Calculus I"
        :maxlength="NAME_MAX_LENGTH"
        :disabled="status === 'loading'"
        required
        class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-100 disabled:text-slate-400"
      >
      <p class="mt-1 text-xs text-slate-400">{{ form.name.length }}/{{ NAME_MAX_LENGTH }}</p>
    </div>

    <div>
      <label for="subject-description" class="block text-sm font-medium text-slate-700">
        Description <span class="font-normal text-slate-400">(optional)</span>
      </label>
      <textarea
        id="subject-description"
        v-model="form.description"
        rows="3"
        placeholder="Brief notes about this subject"
        :maxlength="DESCRIPTION_MAX_LENGTH"
        :disabled="status === 'loading'"
        class="mt-1 w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-100 disabled:text-slate-400"
      />
      <p class="mt-1 text-xs text-slate-400">
        {{ form.description.length }}/{{ DESCRIPTION_MAX_LENGTH }}
      </p>
    </div>

    <p v-if="status === 'error'" class="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
      {{ errorMessage }}
    </p>

    <p
      v-if="status === 'success'"
      class="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700"
      role="status"
    >
      Subject created successfully.
    </p>

    <button
      type="submit"
      :disabled="status === 'loading'"
      class="w-full inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-indigo-500 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
    >
      {{ status === 'loading' ? 'Creating…' : 'Create subject' }}
    </button>
  </form>
</template>
