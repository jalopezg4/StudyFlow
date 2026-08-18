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
  <div class="flex flex-col gap-6 p-6">
    <h1 class="text-2xl font-semibold text-slate-900">Nueva materia</h1>
    <SubjectForm @created="handleCreated" />

    <section v-if="createdSubjects.length > 0" class="flex flex-col gap-2">
      <h2 class="text-lg font-medium text-slate-900">Materias creadas en esta sesión</h2>
      <ul class="flex flex-col gap-1">
        <li v-for="subject in createdSubjects" :key="subject.id" class="text-sm text-slate-700">
          <strong class="font-medium">{{ subject.name }}</strong>
          <span v-if="subject.description"> — {{ subject.description }}</span>
        </li>
      </ul>
    </section>
  </div>
</template>
