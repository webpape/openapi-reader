<template>
   <span v-if="minimum != null || maximum != null" class="chip chip-constraint">
      <template v-if="minimum != null && maximum != null">{{ minExclusive ? '>' : '≥' }} {{ minimum }} · {{ maxExclusive ? '<' : '≤' }} {{ maximum }}</template>
      <template v-else-if="minimum != null">{{ minExclusive ? '>' : '≥' }} {{ minimum }}</template>
      <template v-else>{{ maxExclusive ? '<' : '≤' }} {{ maximum }}</template>
   </span>
</template>

<script setup lang="ts">
defineProps<{
   minimum?: number
   maximum?: number
   minExclusive?: boolean
   maxExclusive?: boolean
}>()
</script>
