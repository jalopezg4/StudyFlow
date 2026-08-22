<script setup lang="ts">
import { LoginRequestSchema } from '#shared/utils/auth-schemas'

const email = ref('')
const password = ref('')
const fieldErrors = ref<{ email?: string; password?: string }>({})
const formError = ref('')
const isSubmitting = ref(false)

const { login } = useAuth()

watch(password, () => {
  fieldErrors.value.password = undefined
})

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
  <div class="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50 px-4">
    <div class="w-full max-w-sm rounded-xl bg-white p-8 shadow-lg ring-1 ring-slate-900/5">
      <h1 class="mb-6 text-2xl font-bold tracking-tight text-slate-900">Log in to StudyFlow</h1>

      <form class="space-y-4" novalidate @submit.prevent="onSubmit">
        <div>
          <label for="email" class="block text-sm font-medium text-slate-700">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            autocomplete="email"
            class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            @input="fieldErrors.email = undefined"
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
          class="w-full inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-indigo-500 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
        >
          {{ isSubmitting ? 'Logging in…' : 'Log in' }}
        </button>
      </form>

      <p class="mt-4 text-sm text-slate-600">
        Don't have an account?
        <NuxtLink to="/register" class="font-semibold text-indigo-600 hover:text-indigo-500 hover:underline">Register</NuxtLink>
      </p>
    </div>
  </div>
</template>
