<template>
   <div v-if="values.length" class="enum-row" :class="{ 'is-expanded': isExpanded }">
      <span class="enum-prefix">enum:</span>
      <span v-for="val in displayedValues" :key="String(val)" class="enum-chip" :title="String(val)">
         {{ format(val) }}
      </span>
      <button
         v-if="values.length > limit"
         type="button"
         class="enum-more-btn"
         :aria-expanded="isExpanded"
         @click="isExpanded = !isExpanded"
      >
         {{ isExpanded ? 'show less' : `+${values.length - limit} more` }}
      </button>
   </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

const props = withDefaults(
   defineProps<{
      values: unknown[]
      limit?: number
   }>(),
   { limit: 8 }
)

const isExpanded = ref(false)

const displayedValues = computed(() => {
   if (isExpanded.value || props.values.length <= props.limit) {
      return props.values
   }
   return props.values.slice(0, props.limit)
})

function format(val: unknown) {
   if (val === '') return '""'
   return String(val)
}
</script>
