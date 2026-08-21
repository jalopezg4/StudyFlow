<script setup lang="ts">
import { useTemplateRef } from 'vue'
import RecommendedTask from '~/components/tasks/RecommendedTask.vue'
import TaskForm from '~/components/tasks/TaskForm.vue'
import TaskList from '~/components/tasks/TaskList.vue'

definePageMeta({ layout: 'authenticated' })

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
  <div class="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-10">
    <div class="mx-auto max-w-2xl">
      <RecommendedTask ref="recommendedTask" class="mb-6" />

      <div class="rounded-xl bg-white p-8 shadow-md ring-1 ring-slate-900/5">
        <h1 class="text-2xl font-bold tracking-tight text-slate-900">New task</h1>
        <p class="mt-1 text-sm text-slate-500">
          Create a study task under one of your subjects.
        </p>

        <div class="mt-6">
          <TaskForm @created="handleCreated" />
        </div>
      </div>

      <section class="mt-6 rounded-xl bg-white p-8 shadow-md ring-1 ring-slate-900/5">
        <TaskList ref="taskList" @changed="handleTasksChanged" />
      </section>
    </div>
  </div>
</template>
