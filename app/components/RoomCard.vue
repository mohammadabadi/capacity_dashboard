<script setup lang="ts">
import type { RoomRow } from '~/utils/capacity'

const props = defineProps<{
  room: RoomRow
}>()

const fill = computed(() => {
  if (props.room.capacity <= 0) return props.room.placesUsed > 0 ? 100 : 0
  return Math.min((props.room.placesUsed / props.room.capacity) * 100, 100)
})

const barClass = computed(() => {
  if (props.room.overCapacity) return 'bg-red-600'
  if (fill.value >= 90) return 'bg-amber-500'
  return 'bg-emerald-700'
})
</script>

<template>
  <article
    class="rounded-lg border-2 bg-white p-4"
    :class="
      room.overCapacity
        ? 'border-red-300 bg-red-50'
        : room.ageGroupMismatchCount
          ? 'border-amber-300'
          : 'border-stone-200'
    "
  >
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 class="font-semibold">Room {{ room.name }}</h3>
        <p class="text-sm text-stone-500">
          {{ room.acceptedLabels.join(', ') }}
        </p>
      </div>
      <p class="text-right text-sm tabular-nums">
        <b class="block text-base"
          >{{ room.placesUsed }} / {{ room.capacity }}</b
        >
        <span class="text-stone-500">
          {{
            room.overCapacity
              ? `${room.placesUsed - room.capacity} over`
              : `${room.capacity - room.placesUsed} open`
          }}
        </span>
      </p>
    </div>

    <div
      class="my-3 h-2 overflow-hidden rounded bg-stone-200"
      :title="`${room.placesUsed} of ${room.capacity} places used`"
      role="progressbar"
      aria-valuemin="0"
      :aria-valuemax="Math.max(room.capacity, 0)"
      :aria-valuenow="Math.min(room.placesUsed, Math.max(room.capacity, 0))"
      :aria-valuetext="`${room.placesUsed} of ${room.capacity} places used`"
    >
      <div class="h-full" :class="barClass" :style="{ width: fill + '%' }" />
    </div>

    <p class="text-sm text-stone-500">
      {{ room.children.length }}
      {{ room.children.length === 1 ? 'child' : 'children' }}
      · FT {{ room.fullTime }} · 3D {{ room.threeDay }} · 2D {{ room.twoDay }}
    </p>

    <p v-if="room.overCapacity" class="mt-2 text-sm text-red-800">
      Over capacity after pairing.
    </p>
    <p v-if="room.ageGroupMismatchCount" class="mt-1 text-sm text-amber-800">
      {{ room.ageGroupMismatchCount }}
      {{ room.ageGroupMismatchCount === 1 ? 'child is' : 'children are' }}
      outside the age groups this room accepts.
    </p>

    <details v-if="room.children.length" class="mt-3">
      <summary class="cursor-pointer text-sm font-medium">Children</summary>
      <ul class="mt-2 text-sm">
        <li
          v-for="child in room.children"
          :key="child.enrolmentId"
          class="flex flex-wrap justify-between gap-2 border-t border-stone-100 py-1"
        >
          <span>{{ child.name }}</span>
          <span class="text-stone-500">
            {{ child.attendanceShort }} · {{ child.ageGroupLabel }}
            <span
              v-if="child.ageGroupMismatch"
              class="font-medium text-amber-800"
            >
              · age-group mismatch
            </span>
          </span>
        </li>
      </ul>
    </details>
  </article>
</template>
