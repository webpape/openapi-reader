<template>
   <div class="json-node">
      <div class="json-line">
         <button v-if="branch && entries.length" type="button" class="json-toggle" :aria-expanded="open" :aria-label="open ? 'Collapse' : 'Expand'" @click="open = !open">
            <i class="pi" :class="open ? 'pi-minus' : 'pi-plus'"></i>
         </button>
         <span v-else class="json-toggle-spacer"></span>
         <template v-if="name">
            <span class="json-key">"{{ name }}"</span>
            <span class="json-punct">: </span>
         </template>
         <template v-if="branch">
            <span class="json-punct">{{ array ? '[' : '{' }}</span>
            <template v-if="!open || !entries.length">
               <span v-if="entries.length" class="json-count">…</span>
               <span class="json-punct">{{ array ? ']' : '}' }}</span>
               <span v-if="comma" class="json-punct">,</span>
            </template>
         </template>
         <template v-else>
            <span :class="valueClass">{{ literal }}</span>
            <span v-if="comma" class="json-punct">,</span>
         </template>
      </div>
      <div v-if="branch && open && entries.length" class="json-children">
         <XJsonNode v-for="(entry, index) in entries" :key="entry.key" :name="array ? undefined : entry.key" :value="entry.value" :depth="depth + 1" :comma="index < entries.length - 1" />
         <div class="json-line">
            <span class="json-toggle-spacer"></span>
            <span class="json-punct">{{ array ? ']' : '}' }}</span>
            <span v-if="comma" class="json-punct">,</span>
         </div>
      </div>
   </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps<{
   name?: string
   value: unknown
   depth: number
   comma?: boolean
}>()

const array = computed(() => Array.isArray(props.value))
const branch = computed(() => props.value !== null && typeof props.value === 'object')
const entries = computed(() => {
   if (Array.isArray(props.value)) return props.value.map((value, index) => ({ key: String(index), value }))
   if (props.value && typeof props.value === 'object') return Object.entries(props.value).map(([key, value]) => ({ key, value }))
   return []
})
const open = ref(props.depth < 1)

const literal = computed(() => {
   if (typeof props.value === 'string') return JSON.stringify(props.value)
   if (props.value === undefined) return ''
   return String(props.value)
})
const valueClass = computed(() => {
   if (typeof props.value === 'string') return 'json-string'
   if (typeof props.value === 'number') return 'json-number'
   return 'json-literal'
})
</script>
