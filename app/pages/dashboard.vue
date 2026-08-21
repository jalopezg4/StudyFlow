<script setup lang="ts">
import SubjectList from '~/components/subjects/SubjectList.vue'

definePageMeta({ layout: 'authenticated' })
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-10">
    <div class="mx-auto max-w-2xl rounded-xl bg-white p-8 shadow-md ring-1 ring-slate-900/5">
      <h1 class="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
      <p class="mt-4 text-slate-600">
        Welcome to StudyFlow. This page is only reachable while you are logged in.
      </p>
      <div class="mt-6 flex flex-wrap gap-3">
        <NuxtLink
          to="/subjects"
          class="inline-flex w-fit items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-indigo-500 hover:shadow-md active:scale-[0.98]"
        >
          Create subject
        </NuxtLink>
        <NuxtLink
          to="/tasks"
          class="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-150 hover:border-slate-400 hover:bg-slate-50 active:scale-[0.98]"
        >
          Create task
        </NuxtLink>
      </div>

      <div class="mt-8 border-t border-slate-200 pt-6">
        <SubjectList />
      </div>
    </div>
  </div>
</template>
