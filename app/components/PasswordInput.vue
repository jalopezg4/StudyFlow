<script setup lang="ts">
defineProps<{
  id: string;
  autocomplete?: string;
}>();

const modelValue = defineModel<string>({ required: true });
const showPassword = ref(false);
</script>

<template>
  <div class="relative mt-1">
    <input
      :id="id"
      v-model="modelValue"
      :type="showPassword ? 'text' : 'password'"
      :autocomplete="autocomplete"
      class="w-full rounded-md border border-slate-300 px-3 py-2 pr-10 text-sm focus:border-slate-500 focus:outline-none"
    />
    <button
      type="button"
      tabindex="-1"
      class="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-slate-700"
      :aria-label="showPassword ? 'Hide password' : 'Show password'"
      @click="showPassword = !showPassword"
    >
      <svg
        v-if="!showPassword"
        class="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
      <svg
        v-else
        class="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
        <path
          d="M10.73 5.08A10.94 10.94 0 0 1 12 5c7 0 11 8 11 8a13.16 13.16 0 0 1-1.67 2.68"
        />
        <path
          d="M6.61 6.61A13.53 13.53 0 0 0 1 12s4 8 11 8a10.66 10.66 0 0 0 5.39-1.61"
        />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    </button>
  </div>
</template>
