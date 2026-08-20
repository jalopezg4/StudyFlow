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
  <form novalidate class="flex flex-col gap-4" @submit.prevent="handleSubmit">
    <div>
      <label for="subject-name" class="block text-sm font-medium text-slate-700">Nombre</label>
      <input
        id="subject-name"
        v-model="form.name"
        type="text"
        placeholder="p. ej. Cálculo I"
        :maxlength="NAME_MAX_LENGTH"
        :disabled="status === 'loading'"
        required
        class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none disabled:bg-slate-100"
      >
      <p class="mt-1 text-xs text-slate-400">{{ form.name.length }}/{{ NAME_MAX_LENGTH }}</p>
    </div>

    <div>
      <label for="subject-description" class="block text-sm font-medium text-slate-700">
        Descripción <span class="font-normal text-slate-400">(opcional)</span>
      </label>
      <textarea
        id="subject-description"
        v-model="form.description"
        rows="3"
        placeholder="Notas breves sobre esta materia"
        :maxlength="DESCRIPTION_MAX_LENGTH"
        :disabled="status === 'loading'"
        class="mt-1 w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none disabled:bg-slate-100"
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
      Materia creada correctamente.
    </p>

    <button
      type="submit"
      :disabled="status === 'loading'"
      class="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
    >
      {{ status === 'loading' ? 'Creando…' : 'Crear materia' }}
    </button>
  </form>
</template>
