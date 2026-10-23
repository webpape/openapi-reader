<template>
   <span v-if="pattern" class="chip chip-pattern" :title="pattern">{{ pattern }}</span>
</template>

<script setup lang="ts">
defineProps<{ pattern?: string }>()
</script>
