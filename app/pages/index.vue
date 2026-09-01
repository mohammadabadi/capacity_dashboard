<script setup lang="ts">
const {
  dashboard,
  error,
  errorMessage,
  errorStatus,
  isLoading,
  month,
  refresh,
  selectedMonth,
  setMonth,
  useCurrentMonth,
} = useCapacityOverview()

const monthLabel = computed(() => {
  if (!dashboard.value) return ''
  return new Intl.DateTimeFormat('en-CA', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${dashboard.value.month}-01T12:00:00`))
})

function onMonthChange(event: Event) {
  setMonth((event.target as HTMLSelectElement).value)
}
</script>

<template>
  <main
    class="mx-auto max-w-5xl px-4 py-8"
    :aria-busy="isLoading ? 'true' : 'false'"
  >
    <header class="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold">Capacity</h1>
        <p class="mt-1 max-w-lg text-stone-600">
          Places, not headcount. Full-time takes one seat. A 3-day and a 2-day
          child can share one. Unassigned children are listed, not counted.
        </p>
      </div>
      <label class="text-sm text-stone-600">
        Month
        <select
          class="mt-1 block min-w-40 rounded border border-stone-300 bg-white px-2 py-1.5 text-stone-900"
          :value="selectedMonth"
          :disabled="isLoading"
          @change="onMonthChange"
        >
          <option v-if="!dashboard" value="" disabled>Loading…</option>
          <option
            v-for="item in dashboard?.availableMonths ?? []"
            :key="item"
            :value="item"
          >
            {{ item }}
          </option>
        </select>
      </label>
    </header>

    <p
      v-if="isLoading && dashboard"
      class="mb-4 flex items-center gap-2 text-sm text-stone-500"
      role="status"
      aria-live="polite"
    >
      <span
        class="size-4 animate-spin rounded-full border-2 border-stone-300 border-t-stone-700 motion-reduce:animate-none"
        aria-hidden="true"
      />
      Updating capacity data…
    </p>

    <p
      v-if="isLoading && !dashboard"
      class="flex items-center justify-center gap-2 py-16 text-stone-500"
      role="status"
      aria-live="polite"
    >
      <span
        class="size-5 animate-spin rounded-full border-2 border-stone-300 border-t-stone-700 motion-reduce:animate-none"
        aria-hidden="true"
      />
      Loading centres and enrolments…
    </p>

    <div
      v-else-if="error && !dashboard"
      class="py-16 text-center text-stone-700"
      role="alert"
    >
      <p>{{ errorMessage }}</p>
      <button
        v-if="errorStatus !== 422"
        class="mt-3 rounded bg-stone-900 px-3 py-1.5 text-white"
        type="button"
        @click="refresh()"
      >
        Retry
      </button>
      <button
        v-if="errorStatus === 422"
        class="mt-3 rounded border border-stone-300 px-3 py-1.5"
        type="button"
        @click="useCurrentMonth()"
      >
        Current month
      </button>
    </div>

    <template v-else-if="dashboard">
      <div
        v-if="error"
        class="mb-4 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
        role="alert"
      >
        <p>{{ errorMessage }} Showing data for {{ dashboard.month }}.</p>
        <div class="mt-2 flex flex-wrap gap-3">
          <button
            v-if="errorStatus !== 422"
            class="font-medium underline"
            type="button"
            @click="refresh()"
          >
            Retry
          </button>
          <button
            v-if="month"
            class="font-medium underline"
            type="button"
            @click="useCurrentMonth()"
          >
            Use current month
          </button>
        </div>
      </div>

      <section
        class="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        aria-label="Month summary"
      >
        <div class="rounded-lg border border-stone-200 bg-white p-4">
          <p class="text-sm text-stone-500">{{ monthLabel }}</p>
          <p class="text-xs text-stone-500">
            Effective {{ dashboard.effectiveOn }} · {{ dashboard.timezone }}
          </p>
          <p class="text-xl font-semibold">
            {{ dashboard.placesUsed }} / {{ dashboard.totalCapacity }}
          </p>
          <p class="text-sm text-stone-500">
            {{ dashboard.openPlaces }} open across rooms
          </p>
        </div>
        <div class="rounded-lg border border-stone-200 bg-white p-4">
          <p class="text-sm text-stone-500">Assigned children vs places</p>
          <p class="text-xl font-semibold">
            {{ dashboard.assignedChildren }} → {{ dashboard.placesUsed }}
          </p>
          <p class="text-sm text-stone-500">headcount after pairing</p>
        </div>
        <div
          class="rounded-lg border p-4"
          :class="
            dashboard.overCapacityRooms
              ? 'border-red-200 bg-red-50'
              : 'border-stone-200 bg-white'
          "
        >
          <p class="text-sm text-stone-500">Over capacity</p>
          <p class="text-xl font-semibold">
            {{ dashboard.overCapacityRooms }}
          </p>
          <p class="text-sm text-stone-500">
            {{ dashboard.overCapacityRooms === 1 ? 'room' : 'rooms' }}
          </p>
        </div>
        <div
          class="rounded-lg border p-4"
          :class="
            dashboard.unassigned || dashboard.ageGroupMismatches
              ? 'border-amber-200 bg-amber-50'
              : 'border-stone-200 bg-white'
          "
        >
          <p class="text-sm text-stone-500">Needs a place or a move</p>
          <p class="text-xl font-semibold">
            {{ dashboard.unassigned + dashboard.ageGroupMismatches }}
          </p>
          <p class="text-sm text-stone-500">
            {{ dashboard.unassigned }} unassigned ·
            {{ dashboard.ageGroupMismatches }} age-group mismatch
          </p>
        </div>
      </section>

      <section
        v-if="dashboard.issues.length"
        class="mb-8 rounded-lg border border-stone-200 bg-white p-4"
      >
        <h2 class="text-sm font-semibold">Needs attention</h2>
        <ul class="mt-2 list-disc space-y-1 pl-5 text-sm text-yellow-600">
          <li v-for="(item, index) in dashboard.issues" :key="index">
            {{ item }}
          </li>
        </ul>
      </section>

      <p
        v-if="dashboard.centres.length === 0"
        class="py-16 text-center text-stone-500"
      >
        No centres returned for this month.
      </p>

      <section
        v-for="centre in dashboard.centres"
        :key="centre.id"
        class="mb-10 border border-stone-200 rounded-lg p-4 bg-white"
      >
        <div class="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 class="text-lg font-semibold">{{ centre.name }}</h2>
          <p class="text-sm text-stone-500">
            {{ centre.placesUsed }} / {{ centre.capacity }} places
            <template v-if="centre.unassigned.length">
              · {{ centre.unassigned.length }} unassigned
            </template>
          </p>
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <RoomCard v-for="room in centre.rooms" :key="room.id" :room="room" />
        </div>

        <div
          v-if="centre.unassigned.length"
          class="mt-3 rounded-lg border border-stone-200 bg-white p-4"
        >
          <h3 class="text-sm font-semibold">
            Unassigned — not counted against a room
          </h3>
          <ul class="mt-2 text-sm">
            <li
              v-for="child in centre.unassigned"
              :key="child.enrolmentId"
              class="flex flex-wrap justify-between gap-2 border-t border-stone-100 py-1"
            >
              <span>{{ child.name }}</span>
              <span class="text-stone-500">
                {{ child.ageGroupLabel }} · {{ child.attendanceShort }}
              </span>
            </li>
          </ul>
        </div>
      </section>
    </template>
  </main>
</template>
