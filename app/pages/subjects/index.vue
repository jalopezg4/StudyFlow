<script setup lang="ts">
import { ref } from 'vue'
import SubjectForm from '~/components/subjects/SubjectForm.vue'

interface CreatedSubject {
  id: string
  name: string
  description: string | null
  createdAt: string
}

// Session-local confirmation list only; a persisted subject listing is a
// separate future user story (see specs/004-subject-management/research.md).
const createdSubjects = ref<CreatedSubject[]>([])

function handleCreated(subject: CreatedSubject) {
  createdSubjects.value = [subject, ...createdSubjects.value]
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 px-4 py-10">
    <div class="mx-auto max-w-2xl">
      <NuxtLink
        to="/dashboard"
        class="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        ← Volver al dashboard
      </NuxtLink>

      <div class="rounded-lg bg-white p-8 shadow">
        <h1 class="text-2xl font-semibold text-slate-900">Nueva materia</h1>
        <p class="mt-1 text-sm text-slate-500">
          Crea una materia para organizar tus tareas y sesiones de estudio.
        </p>

        <div class="mt-6">
          <SubjectForm @created="handleCreated" />
        </div>
      </div>

      <section v-if="createdSubjects.length > 0" class="mt-6 rounded-lg bg-white p-8 shadow">
        <h2 class="text-lg font-medium text-slate-900">Materias creadas en esta sesión</h2>
        <ul class="mt-4 flex flex-col gap-3">
          <li
            v-for="subject in createdSubjects"
            :key="subject.id"
            class="rounded-md border border-slate-200 px-4 py-3"
          >
            <p class="text-sm font-medium text-slate-900">{{ subject.name }}</p>
            <p v-if="subject.description" class="mt-1 text-sm text-slate-500">
              {{ subject.description }}
            </p>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>
