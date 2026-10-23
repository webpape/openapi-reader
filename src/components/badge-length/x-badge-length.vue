<template>
   <span v-if="minLength != null || maxLength != null" class="chip chip-constraint">
      <template v-if="minLength != null && maxLength != null">{{ minLength }}…{{ maxLength }}</template>
      <template v-else-if="minLength != null">≥ {{ minLength }}</template>
      <template v-else>≤ {{ maxLength }}</template>
      characters
   </span>
</template>

<script setup lang="ts">
defineProps<{
   minLength?: number
   maxLength?: number
}>()
</script>
