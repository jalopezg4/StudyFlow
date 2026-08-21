<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    id?: string
    minDate?: string
    disabled?: boolean
    placeholder?: string
  }>(),
  {
    id: undefined,
    minDate: undefined,
    disabled: false,
    placeholder: 'Select a date'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

function toDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function parseDateStr(value: string): { year: number, month: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null
  return { year: Number(match[1]), month: Number(match[2]) - 1 }
}

const today = new Date()
const initial = parseDateStr(props.modelValue) ?? { year: today.getUTCFullYear(), month: today.getUTCMonth() }

const open = ref(false)
const viewYear = ref(initial.year)
const viewMonth = ref(initial.month)
const rootRef = useTemplateRef('rootRef')

interface DayCell {
  dateStr: string
  day: number
  disabled: boolean
  isToday: boolean
}

const monthLabel = computed(() => `${MONTH_LABELS[viewMonth.value]} ${viewYear.value}`)

// UTC, to match the server's own clock (server/utils/tasks/schemas.ts's
// isPastDate) - local time could disagree with the server by a day near a
// timezone's midnight boundary, which would highlight/enable the wrong day.
function toUtcDateStr(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
}

const cells = computed<(DayCell | null)[]>(() => {
  const year = viewYear.value
  const month = viewMonth.value
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayStr = toUtcDateStr(today)

  const result: (DayCell | null)[] = []
  for (let i = 0; i < firstWeekday; i++) {
    result.push(null)
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = toDateStr(new Date(year, month, day))
    result.push({
      dateStr,
      day,
      disabled: props.minDate !== undefined && dateStr < props.minDate,
      isToday: dateStr === todayStr
    })
  }
  return result
})

function prevMonth() {
  if (viewMonth.value === 0) {
    viewMonth.value = 11
    viewYear.value -= 1
  } else {
    viewMonth.value -= 1
  }
}

function nextMonth() {
  if (viewMonth.value === 11) {
    viewMonth.value = 0
    viewYear.value += 1
  } else {
    viewMonth.value += 1
  }
}

function selectDate(dateStr: string) {
  emit('update:modelValue', dateStr)
  open.value = false
}

function clearDate() {
  emit('update:modelValue', '')
  open.value = false
}

function toggleOpen() {
  if (props.disabled) return
  open.value = !open.value
}

function handleClickOutside(event: MouseEvent) {
  if (open.value && rootRef.value && !rootRef.value.contains(event.target as Node)) {
    open.value = false
  }
}

function handleEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    open.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleEscape)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleEscape)
})

watch(
  () => props.modelValue,
  (value) => {
    const parsed = parseDateStr(value)
    if (parsed) {
      viewYear.value = parsed.year
      viewMonth.value = parsed.month
    }
  }
)
</script>

<template>
  <div ref="rootRef" class="relative">
    <button
      :id="id"
      type="button"
      :disabled="disabled"
      class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-left text-sm shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-100 disabled:text-slate-400"
      :class="modelValue ? 'text-slate-900' : 'text-slate-400'"
      @click="toggleOpen"
    >
      {{ modelValue || placeholder }}
    </button>

    <div
      v-if="open"
      class="absolute z-10 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-4 shadow-xl ring-1 ring-slate-900/5"
    >
      <div class="mb-3 flex items-center justify-between">
        <button
          type="button"
          aria-label="Previous month"
          class="rounded-full p-1.5 text-slate-500 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
          @click="prevMonth"
        >
          ‹
        </button>
        <span class="text-sm font-semibold text-slate-900">{{ monthLabel }}</span>
        <button
          type="button"
          aria-label="Next month"
          class="rounded-full p-1.5 text-slate-500 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
          @click="nextMonth"
        >
          ›
        </button>
      </div>

      <div class="mb-1 grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-400">
        <span v-for="(label, index) in WEEKDAY_LABELS" :key="index">{{ label }}</span>
      </div>

      <div class="grid grid-cols-7 gap-1">
        <template v-for="(cell, index) in cells" :key="index">
          <div v-if="!cell" />
          <button
            v-else
            type="button"
            :disabled="cell.disabled"
            :data-date="cell.dateStr"
            :aria-label="cell.dateStr"
            :aria-pressed="cell.dateStr === modelValue"
            class="flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors"
            :class="[
              cell.dateStr === modelValue
                ? 'bg-indigo-600 text-white shadow-sm'
                : cell.disabled
                  ? 'cursor-not-allowed text-slate-300 line-through'
                  : 'text-slate-700 hover:bg-indigo-50 hover:text-indigo-600',
              cell.isToday && cell.dateStr !== modelValue ? 'ring-1 ring-indigo-400' : ''
            ]"
            @click="selectDate(cell.dateStr)"
          >
            {{ cell.day }}
          </button>
        </template>
      </div>

      <div class="mt-3 flex justify-between border-t border-slate-100 pt-2">
        <button type="button" class="text-xs font-semibold text-slate-500 transition-colors hover:text-indigo-600" @click="clearDate">
          Clear
        </button>
        <button type="button" class="text-xs font-semibold text-slate-500 transition-colors hover:text-indigo-600" @click="open = false">
          Close
        </button>
      </div>
    </div>
  </div>
</template>
