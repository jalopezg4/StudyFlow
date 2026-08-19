<script setup lang="ts">
import { RegisterRequestSchema } from '#shared/utils/auth-schemas'

const email = ref('')
const password = ref('')
const fieldErrors = ref<{ email?: string; password?: string }>({})
const formError = ref('')
const successMessage = ref('')
const isSubmitting = ref(false)

const { register } = useAuth()

async function onSubmit() {
  formError.value = ''
  successMessage.value = ''
  fieldErrors.value = {}

  const result = RegisterRequestSchema.safeParse({ email: email.value, password: password.value })

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
    const { hasSession } = await register(result.data.email, result.data.password)

    if (hasSession) {
      await navigateTo('/dashboard')
      return
    }

    // No session means Supabase silently rejected a duplicate email (anti-enumeration
    // behavior) rather than throwing — show the same generic outcome either way.
    successMessage.value = 'Account created. You can log in now.'
  } catch {
    formError.value = 'We could not complete your registration. Please check your details and try again.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-slate-50 px-4">
    <div class="w-full max-w-sm rounded-lg bg-white p-8 shadow">
      <h1 class="mb-6 text-2xl font-semibold text-slate-900">Create your account</h1>

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
          <PasswordInput id="password" v-model="password" autocomplete="new-password" />
          <p v-if="fieldErrors.password" class="mt-1 text-sm text-red-600">{{ fieldErrors.password }}</p>
        </div>

        <p v-if="formError" class="text-sm text-red-600">{{ formError }}</p>
        <p v-if="successMessage" class="text-sm text-green-600">{{ successMessage }}</p>

        <button
          type="submit"
          :disabled="isSubmitting"
          class="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {{ isSubmitting ? 'Creating account…' : 'Register' }}
        </button>
      </form>

      <p class="mt-4 text-sm text-slate-600">
        Already have an account?
        <NuxtLink to="/login" class="font-medium text-slate-900 underline">Log in</NuxtLink>
      </p>
    </div>
  </div>
</template>
