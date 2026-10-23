<template>
   <span v-if="store.showObjectNames && names.length > 1" class="type-pills">
      <button v-for="name in names" :key="name" type="button" class="chip chip-type is-object" :title="name" @click.stop="open(name)">{{ name }}</button>
      <span v-if="array" class="chip chip-type">[]</span>
   </span>
   <button v-else-if="store.showObjectNames && schemaName" type="button" class="chip chip-type" :class="typeClass" :title="type" @click.stop="open(schemaName)">{{ type }}</button>
   <span v-else-if="array && schemaName" class="chip chip-type is-array">[]</span>
   <span v-else-if="!schemaName && type" class="chip chip-type is-plain" :class="typeClass" :title="type">{{ type }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSchemaDialog } from 'src/composables/use-schema-dialog'
import { useGlobalStore } from 'src/stores/global'

const props = defineProps<{
   type?: string
   schemaName?: string
   schemaNames?: string[]
}>()

const router = useRouter()
const store = useGlobalStore()
const openSchema = useSchemaDialog()
const names = computed(() => (props.schemaNames || []).filter(Boolean))
const array = computed(() => Boolean(props.type?.endsWith('[]')))

function open(name: string) {
   if (openSchema) openSchema(name)
   else router.push({ name: 'schema', params: { name } })
}

const typeClass = computed(() => {
   if (props.schemaName) return 'is-object'
   const type = props.type || ''
   if (type.includes('[]')) return 'is-array'
   if (type.startsWith('string')) return 'is-string'
   if (type === 'boolean') return 'is-boolean'
   if (type === 'integer' || type === 'number') return 'is-number'
   return ''
})
</script>
