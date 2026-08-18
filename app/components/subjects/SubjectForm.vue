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
    return 'El nombre es obligatorio.'
  }

  if (trimmedName.length > NAME_MAX_LENGTH) {
    return `El nombre no puede superar ${NAME_MAX_LENGTH} caracteres.`
  }

  if (form.description.trim().length > DESCRIPTION_MAX_LENGTH) {
    return `La descripción no puede superar ${DESCRIPTION_MAX_LENGTH} caracteres.`
  }

  return null
}

function extractErrorMessage(error: unknown): string {
  const fetchError = error as { data?: { error?: { message?: string } } }
  return fetchError.data?.error?.message ?? 'No se pudo crear la materia. Inténtalo de nuevo.'
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
  <form novalidate class="flex max-w-md flex-col gap-4" @submit.prevent="handleSubmit">
    <div class="flex flex-col gap-1">
      <label for="subject-name" class="text-sm font-medium text-slate-700">Nombre</label>
      <input
        id="subject-name"
        v-model="form.name"
        type="text"
        :maxlength="NAME_MAX_LENGTH"
        :disabled="status === 'loading'"
        required
        class="rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
      >
    </div>

    <div class="flex flex-col gap-1">
      <label for="subject-description" class="text-sm font-medium text-slate-700">Descripción (opcional)</label>
      <textarea
        id="subject-description"
        v-model="form.description"
        :maxlength="DESCRIPTION_MAX_LENGTH"
        :disabled="status === 'loading'"
        class="rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
      />
    </div>

    <button
      type="submit"
      :disabled="status === 'loading'"
      class="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
    >
      {{ status === 'loading' ? 'Creando...' : 'Crear materia' }}
    </button>

    <p v-if="status === 'error'" class="text-sm text-red-700" role="alert">
      {{ errorMessage }}
    </p>

    <p v-if="status === 'success'" class="text-sm text-green-700" role="status">
      Materia creada correctamente.
    </p>
  </form>
</template>
