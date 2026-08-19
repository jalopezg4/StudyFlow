<script setup lang="ts">
import { LoginRequestSchema } from '#shared/utils/auth-schemas'

const email = ref('')
const password = ref('')
const fieldErrors = ref<{ email?: string; password?: string }>({})
const formError = ref('')
const isSubmitting = ref(false)

const { login } = useAuth()

async function onSubmit() {
  formError.value = ''
  fieldErrors.value = {}

  const result = LoginRequestSchema.safeParse({ email: email.value, password: password.value })

  if (!result.success) {
    for (const issue of result.error.issues) {
      const field = issue.path[0]
      if (field === 'email' || field === 'password') {
        fieldErrors.value[field] = issue.message
      }
    }
    return
  }

  isSubmitting.value = true

  try {
    await login(result.data.email, result.data.password)
    await navigateTo('/dashboard')
  } catch {
    formError.value = 'Incorrect email or password.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-slate-50 px-4">
    <div class="w-full max-w-sm rounded-lg bg-white p-8 shadow">
      <h1 class="mb-6 text-2xl font-semibold text-slate-900">Log in to StudyFlow</h1>

      <form class="space-y-4" novalidate @submit.prevent="onSubmit">
        <div>
          <label for="email" class="block text-sm font-medium text-slate-700">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            autocomplete="email"
            class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          >
          <p v-if="fieldErrors.email" class="mt-1 text-sm text-red-600">{{ fieldErrors.email }}</p>
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-slate-700">Password</label>
          <PasswordInput id="password" v-model="password" autocomplete="current-password" />
          <p v-if="fieldErrors.password" class="mt-1 text-sm text-red-600">{{ fieldErrors.password }}</p>
        </div>

        <p v-if="formError" class="text-sm text-red-600">{{ formError }}</p>

        <button
          type="submit"
          :disabled="isSubmitting"
          class="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {{ isSubmitting ? 'Logging in…' : 'Log in' }}
        </button>
      </form>

      <p class="mt-4 text-sm text-slate-600">
        Don't have an account?
        <NuxtLink to="/register" class="font-medium text-slate-900 underline">Register</NuxtLink>
      </p>
    </div>
  </div>
</template>
