<template>
   <span v-if="store.showObjectNames && primaryName && !fieldRef" class="type-pills">
      <button type="button" class="chip chip-type is-object" :title="primaryName" @click.stop="open(primaryName)">{{ primaryName }}</button>
      <span v-if="array" class="chip chip-type">[]</span>
   </span>
   <span v-else-if="array && schemaName && !fieldRef" class="chip chip-type is-array">[]</span>
   <span v-else-if="type || fieldObjectName" class="type-pills">
      <span v-if="type" class="chip chip-type is-plain" :class="primitiveClass" :title="type">{{ type }}</span>
      <button v-if="fieldObjectName" type="button" class="field-object-name" :title="fieldObjectName" @click.stop="open(fieldObjectName)">{{ fieldObjectName }}</button>
   </span>
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
const primaryName = computed(() => names.value[0] || props.schemaName || '')
const array = computed(() => Boolean(props.type?.endsWith('[]')))
const fieldRef = computed(() => /^(string|integer|number|boolean|any)(\[\])*$/.test(props.type || '') && Boolean(primaryName.value))
const fieldObjectName = computed(() => (store.showFieldObject && fieldRef.value ? primaryName.value : ''))
const primitiveClass = computed(() => {
   const type = props.type || ''
   if (type.includes('[]')) return 'is-array'
   if (type.startsWith('string')) return 'is-string'
   if (type === 'boolean') return 'is-boolean'
   if (type === 'integer' || type === 'number') return 'is-number'
   return ''
})

function open(name: string) {
   if (openSchema) openSchema(name)
   else router.push({ name: 'schema', params: { name } })
}
</script>
