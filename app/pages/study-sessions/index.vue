<script setup lang="ts">
import StudySessionForm from '~/components/study-sessions/StudySessionForm.vue'
import StudySessionList from '~/components/study-sessions/StudySessionList.vue'

definePageMeta({ layout: 'authenticated' })
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-10">
    <div class="mx-auto max-w-2xl">
      <div class="rounded-xl bg-white p-8 shadow-md ring-1 ring-slate-900/5">
        <h1 class="text-2xl font-bold tracking-tight text-slate-900">Record study session</h1>
        <p class="mt-1 text-sm text-slate-500">
          Track time spent on a subject or a specific study task.
        </p>

        <div class="mt-6">
          <StudySessionForm />
        </div>

        <StudySessionList />
      </div>
    </div>
  </div>
</template>
