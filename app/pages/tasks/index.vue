<script setup lang="ts">
import { useTemplateRef } from 'vue'
import RecommendedTask from '~/components/tasks/RecommendedTask.vue'
import TaskForm from '~/components/tasks/TaskForm.vue'
import TaskList from '~/components/tasks/TaskList.vue'

const taskList = useTemplateRef('taskList')
const recommendedTask = useTemplateRef('recommendedTask')

function handleCreated() {
  taskList.value?.refresh()
  recommendedTask.value?.refresh()
}

function handleTasksChanged() {
  recommendedTask.value?.refresh()
}
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

      <RecommendedTask ref="recommendedTask" class="mb-6" />

      <div class="rounded-lg bg-white p-8 shadow">
        <h1 class="text-2xl font-semibold text-slate-900">New task</h1>
        <p class="mt-1 text-sm text-slate-500">
          Create a study task under one of your subjects.
        </p>

        <div class="mt-6">
          <TaskForm @created="handleCreated" />
        </div>
      </div>

      <section class="mt-6 rounded-lg bg-white p-8 shadow">
        <TaskList ref="taskList" @changed="handleTasksChanged" />
      </section>
    </div>
  </div>
</template>
