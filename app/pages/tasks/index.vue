<script setup lang="ts">
import TaskForm from '~/components/tasks/TaskForm.vue'
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
        <h1 class="text-2xl font-semibold text-slate-900">New task</h1>
        <p class="mt-1 text-sm text-slate-500">
          Create a study task under one of your subjects.
        </p>

        <div class="mt-6">
          <TaskForm />
        </div>
      </div>
    </div>
  </div>
</template>
