<script setup lang="ts">
import { useTemplateRef } from 'vue'
import SubjectForm from '~/components/subjects/SubjectForm.vue'
import SubjectList from '~/components/subjects/SubjectList.vue'

definePageMeta({ layout: 'authenticated' })

const subjectList = useTemplateRef('subjectList')

function handleCreated() {
  subjectList.value?.refresh()
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 px-4 py-10">
    <div class="mx-auto max-w-2xl">
      <div class="rounded-lg bg-white p-8 shadow">
        <h1 class="text-2xl font-semibold text-slate-900">New subject</h1>
        <p class="mt-1 text-sm text-slate-500">
          Create a subject to organize your tasks and study sessions.
        </p>

        <div class="mt-6">
          <SubjectForm @created="handleCreated" />
        </div>
      </div>

      <section class="mt-6 rounded-lg bg-white p-8 shadow">
        <SubjectList ref="subjectList" />
      </section>
    </div>
  </div>
</template>
