<script setup lang="ts">
import StudySessionForm from '~/components/study-sessions/StudySessionForm.vue'
</script>

<template>
  <div class="min-h-screen bg-slate-50 px-4 py-10">
    <div class="mx-auto max-w-2xl">
      <NuxtLink
        to="/dashboard"
        class="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        ← Back to dashboard
      </NuxtLink>

      <div class="rounded-lg bg-white p-8 shadow">
        <h1 class="text-2xl font-semibold text-slate-900">Record study session</h1>
        <p class="mt-1 text-sm text-slate-500">
          Track time spent on a subject or a specific study task.
        </p>

        <div class="mt-6">
          <StudySessionForm />
        </div>
      </div>
    </div>
  </div>
</template>
