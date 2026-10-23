<template>
   <article v-if="schema" class="schema-page" :class="embedded ? 'schema-embedded' : 'page'">
      <header v-if="!embedded" class="page-header">
         <p class="kicker">Schema</p>
         <div class="title-line">
            <h2>{{ schemaName }}</h2>
            <Tag v-if="meta.deprecated" severity="danger" value="Deprecated" />
            <span v-if="store.showObjectNames || !meta.schemaName" class="chip chip-type" :class="meta.schemaName ? 'is-object' : ''">{{ meta.typeLabel }}</span>
         </div>
      </header>
      <div v-else class="schema-dialog-meta">
         <span v-if="store.showObjectNames || !meta.schemaName" class="chip chip-type" :class="meta.schemaName ? 'is-object' : ''">{{ meta.typeLabel }}</span>
         <Tag v-if="meta.deprecated" severity="danger" value="Deprecated" />
      </div>

      <XMarkdown v-if="meta.description" :source="meta.description" />

      <div v-if="meta.enumValues.length" class="enum-row">
         <span v-for="value in meta.enumValues" :key="String(value)" class="enum-chip">{{ typeof value === 'string' ? `"${value}"` : value }}</span>
      </div>

      <p v-if="meta.pattern" class="section-note">Pattern <code>{{ meta.pattern }}</code></p>

      <section v-if="nodes.length" class="section-card">
         <div class="section-head">
            <h3>Fields</h3>
            <span v-if="meta.required?.length" class="section-note">Required: {{ meta.required.join(', ') }}</span>
         </div>
         <XSchemaTree :nodes="nodes" />
      </section>
   </article>
   <article v-else :class="embedded ? 'schema-embedded' : 'page'">
      <Message severity="warn" :closable="false">Schema « {{ schemaName }} » introuvable dans cette spécification.</Message>
   </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import XMarkdown from 'src/components/markdown-view/x-markdown.vue'
import XSchemaTree from 'src/components/schema-tree/x-schema-tree.vue'
import { useOpenApi } from 'src/composables/use-openapi'
import { useGlobalStore } from 'src/stores/global'
import { nodesForSchema, schemaMeta } from 'src/utils/schema-tree'

const props = defineProps<{
   name?: string
   embedded?: boolean
}>()

const route = useRoute()
const store = useGlobalStore()
const { document } = useOpenApi()

const schemaName = computed(() => props.name || decodeURIComponent(String(route.params.name || '')))
const schema = computed(() => {
   const found = document.value?.components?.schemas?.[schemaName.value] || document.value?.definitions?.[schemaName.value]
   if (found && !found.$schemaName) found.$schemaName = schemaName.value
   return found
})
const meta = computed(() => schemaMeta(schema.value, document.value))
const nodes = computed(() => nodesForSchema(schema.value, document.value, schemaName.value))
</script>
