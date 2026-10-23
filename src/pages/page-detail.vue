<template>
   <article v-if="current?.operation" class="page detail-page" :class="{ 'samples-closed': !store.samplesOpen, 'samples-overlay': store.samplesOpen && store.samplesOverlay }">
      <div class="detail-main">
         <header class="page-header">
            <div class="title-block">
               <div class="title-line">
                  <h2>{{ current.operation.summary || current.operation.operationId }}</h2>
                  <Tag v-if="current.operation.deprecated" severity="danger" value="Deprecated" />
                  <Tag v-for="flag in extensions.flags" :key="flag.key" :severity="flagSeverity(flag.label)" :value="flag.label" />
                  <Tag v-for="text in extensions.texts" :key="text.key" severity="secondary" :value="text.label + ': ' + text.value" />
               </div>
               <p v-if="current.operation.operationId" class="operation-id">{{ current.operation.operationId }}</p>
            </div>
            <div class="header-actions">
               <Button label="Copy for LLM" icon="pi pi-copy" size="small" text severity="secondary" class="llm-copy" @click="copyLlm" />
               <Button v-if="current.operation.externalDocs?.url" :label="current.operation.externalDocs.description || 'Docs'" icon="pi pi-external-link" size="small" text severity="secondary" as="a" :href="current.operation.externalDocs.url" target="_blank" rel="noreferrer" />
            </div>
         </header>

         <div v-if="security.length" class="security-row">
            <span v-for="option in security" :key="option.label" class="auth-chip"><i class="pi pi-lock"></i>{{ option.label }}</span>
         </div>

         <div class="path-bar">
            <span class="method" :class="'m-' + current.method">{{ current.method }}</span>
            <code>{{ current.route }}</code>
            <Button class="copy-btn" icon="pi pi-copy" text rounded size="small" aria-label="Copy path" @click="copyPath" />
         </div>

         <XMarkdown v-if="current.operation.description" :source="current.operation.description" />

         <section v-if="extensions.lists.length" class="section-card">
            <div class="section-head">
               <button type="button" class="fold" :aria-expanded="advancedOpen" @click="advancedOpen = !advancedOpen">
                  <span class="caret-disc"><span class="caret" :class="{ open: advancedOpen }"></span></span>
                  <span>Advanced properties</span>
               </button>
            </div>
            <div v-show="advancedOpen" class="advanced-grid">
               <article v-for="list in extensions.lists" :key="list.key">
                  <h3>{{ list.label }} ({{ list.value.length }})</h3>
                  <ul>
                     <li v-for="item in list.value" :key="item">{{ item }}</li>
                  </ul>
               </article>
            </div>
         </section>

         <section v-for="section in parameterBlocks" :key="section.in" class="section-card">
            <div class="section-head">
               <button type="button" class="fold" :aria-expanded="expanded.path" @click="toggleExpand('path')">
                  <span class="caret-disc"><span class="caret" :class="{ open: expanded.path }"></span></span>
                  <span>{{ section.title }}</span>
               </button>
            </div>
            <XSchemaTree :nodes="section.nodes" :expanded="expanded.path" :expand-token="tokens.path" />
         </section>

         <section v-if="request" class="section-card">
            <div class="section-head">
               <button type="button" class="fold" :aria-expanded="expanded.request" @click="toggleExpand('request')">
                  <span class="caret-disc"><span class="caret" :class="{ open: expanded.request }"></span></span>
                  <span>Request body <small v-if="request.required">required</small></span>
               </button>
               <button v-if="store.showObjectNames && request.schemaName" type="button" class="schema-anchor" @click="openSchema(request.schemaName)">{{ request.schemaName }}</button>
               <span v-else-if="store.showObjectNames && request.typeLabel" class="schema-anchor plain">{{ request.typeLabel }}</span>
               <Select v-if="request.contentTypes.length > 1" :model-value="contentType || request.contentType" :options="request.contentTypes" class="content-select" @update:model-value="contentType = $event" />
               <IconField class="filter-field">
                  <InputIcon class="pi pi-search" />
                  <InputText v-model="filterRequest" placeholder="Filter" size="small" />
                  <button v-if="filterRequest" type="button" class="search-clear" aria-label="Clear filter" @click="filterRequest = ''">
                     <i class="pi pi-times"></i>
                  </button>
               </IconField>
            </div>
            <p v-if="request.description" class="section-note">{{ request.description }}</p>
            <p v-if="request.stream" class="section-note">Stream of items (itemSchema).</p>
            <XSchemaTree :nodes="filteredRequest" :expanded="expanded.request" :expand-token="tokens.request" />
         </section>

         <section v-if="responseNodes.length" class="section-card">
            <div class="section-head">
               <button type="button" class="fold" :aria-expanded="expanded.response" @click="toggleExpand('response')">
                  <span class="caret-disc"><span class="caret" :class="{ open: expanded.response }"></span></span>
                  <span>Responses</span>
               </button>
               <IconField class="filter-field">
                  <InputIcon class="pi pi-search" />
                  <InputText v-model="filterResponse" placeholder="Filter" size="small" />
                  <button v-if="filterResponse" type="button" class="search-clear" aria-label="Clear filter" @click="filterResponse = ''">
                     <i class="pi pi-times"></i>
                  </button>
               </IconField>
            </div>
            <XSchemaTree :nodes="filteredResponse" :expanded="expanded.response" :expand-token="tokens.response" />
         </section>

         <section v-if="callbacks.length" class="section-card">
            <div class="section-head"><h3>Callbacks</h3></div>
            <article v-for="callback in callbacks" :key="callback.name + callback.expression" class="callback">
               <div class="path-bar compact">
                  <span class="method" :class="'m-' + callback.method">{{ callback.method }}</span>
                  <code>{{ callback.name }}</code>
               </div>
               <p class="section-note">{{ callback.expression }}</p>
               <XMarkdown v-if="callback.description" :source="callback.description" />
               <XSchemaTree v-if="callback.body" :nodes="callback.body.nodes" />
            </article>
         </section>
      </div>

      <XSamplesPanel :method="current.method" :route="current.route" :webhook="current.webhook" :servers="servers" :security="security" :parameters="parameters" :request-example="request?.example" :responses="sampleResponses" :code-samples="codeSamples" />
   </article>

   <article v-else-if="tagName" class="page">
      <header class="page-header">
         <p class="kicker">Tag</p>
         <h2>{{ tagTitle }}</h2>
      </header>
      <XMarkdown v-if="tagDescription" :source="tagDescription" />
      <div class="tag-operations">
         <RouterLink v-for="operation in tagOperations" :key="operation.method + operation.operationId" class="op-row" :title="operation.route" :to="{ name: 'page-details', params: { object: tagName, operation: operation.operationId } }">
            <span class="method" :class="'m-' + operation.method">{{ operation.method }}</span>
            <span class="op-label" :class="{ strike: operation.deprecated }">{{ operation.summary }}</span>
         </RouterLink>
         <p v-if="!tagOperations.length" class="section-note">No operations for this tag.</p>
      </div>
   </article>

   <article v-else class="page">
      <Message severity="warn" :closable="false">This operation is not in the current specification.</Message>
   </article>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Message from 'primevue/message'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import { useToast } from 'primevue/usetoast'
import XMarkdown from 'src/components/markdown-view/x-markdown.vue'
import XSamplesPanel from 'src/components/samples-panel/x-samples-panel.vue'
import XSchemaTree from 'src/components/schema-tree/x-schema-tree.vue'
import { useOpenApi } from 'src/composables/use-openapi'
import { useSchemaDialog } from 'src/composables/use-schema-dialog'
import { useGlobalStore } from 'src/stores/global'
import { buildNav, findOperation, findWebhook } from 'src/utils/nav'
import { flagSeverity, formatTag, vendorExtensions } from 'src/utils/openapi'
import { operationForLlm, securityOptions, serverOptions } from 'src/utils/samples'
import { bodyModel, callbackModels, filterNodes, listParameters, parameterSections, responseModels, type SchemaNode } from 'src/utils/schema-tree'

const route = useRoute()
const toast = useToast()
const store = useGlobalStore()
const { document } = useOpenApi()
const openSchema = useSchemaDialog() || (() => undefined)

const contentType = ref('')
const filterRequest = ref('')
const filterResponse = ref('')
const advancedOpen = ref(store.showProperties)
const expanded = reactive({ path: true, request: true, response: true })
const tokens = reactive({ path: 0, request: 0, response: 0 })

const tagName = computed(() => (route.name === 'page-details' && typeof route.params.object === 'string' ? route.params.object : ''))
const tagObject = computed(() => document.value?.tags?.find((tag: any) => tag.name === tagName.value))
const tagTitle = computed(() => tagObject.value?.['x-displayName'] || (tagName.value ? formatTag(tagName.value) : ''))
const tagDescription = computed(() => tagObject.value?.description || '')

const current = computed(() => {
   if (!document.value) return undefined
   if (route.name === 'webhook') return findWebhook(document.value, String(route.params.name || ''))
   if (typeof route.params.operation === 'string') return findOperation(document.value, route.params.operation)
   return undefined
})

const extensions = computed(() => vendorExtensions(current.value?.operation))
const parameters = computed(() => (current.value ? listParameters(current.value.pathItem, current.value.operation, document.value) : []))
const parameterBlocks = computed(() => parameterSections(parameters.value))
const request = computed(() => (current.value ? bodyModel(current.value.operation.requestBody, document.value, contentType.value || undefined) : undefined))
const responses = computed(() => (current.value ? responseModels(current.value.operation.responses, document.value) : []))
const callbacks = computed(() => (current.value?.operation?.callbacks ? callbackModels(current.value.operation.callbacks, document.value) : []))
const servers = computed(() => serverOptions(current.value?.operation?.servers || current.value?.pathItem?.servers || document.value?.servers))
const security = computed(() => securityOptions(current.value?.operation?.security !== undefined ? current.value.operation.security : document.value?.security, document.value?.components?.securitySchemes))
const codeSamples = computed(() => current.value?.operation?.['x-codeSamples'] || current.value?.operation?.['x-code-samples'] || [])

const responseNodes = computed<SchemaNode[]>(() =>
   responses.value.map((response) => ({
      key: response.status,
      label: response.status,
      typeLabel: response.typeLabel,
      schemaName: response.schemaName,
      schemaNames: response.schemaNames,
      description: response.description,
      required: false,
      deprecated: false,
      nullable: false,
      readOnly: false,
      writeOnly: false,
      enumValues: [],
      note: [response.contentType, response.stream ? 'stream' : '', response.headers.length ? `Headers: ${response.headers.map((header) => header.name).join(', ')}` : '', response.links.length ? `Links: ${response.links.map((link) => link.name).join(', ')}` : '', response.others.length ? `Also: ${response.others.join(', ')}` : ''].filter(Boolean).join(' · '),
      children: response.nodes
   }))
)

const filteredRequest = computed(() => filterNodes(request.value?.nodes || [], filterRequest.value.trim().toLowerCase()))
const filteredResponse = computed(() => filterNodes(responseNodes.value, filterResponse.value.trim().toLowerCase()))
const sampleResponses = computed(() => responses.value.map((response) => ({ status: response.status, description: response.description, example: response.example })))
const tagOperations = computed(() => {
   const model = document.value ? buildNav(document.value) : undefined
   return (model?.byTag[tagName.value] || []).filter((operation) => store.showDeprecated || !operation.deprecated)
})

watch(
   () => [route.params.operation, route.params.name, route.params.object],
   () => {
      contentType.value = ''
      filterRequest.value = ''
      filterResponse.value = ''
      advancedOpen.value = store.showProperties
      expanded.path = true
      expanded.request = true
      expanded.response = true
   }
)

function toggleExpand(section: 'path' | 'request' | 'response') {
   expanded[section] = !expanded[section]
   tokens[section] += 1
}

async function copyPath() {
   await navigator.clipboard.writeText(current.value?.route || '')
   toast.add({ severity: 'success', summary: 'Copié', detail: 'La route a été copiée.', life: 2200 })
}

async function copyLlm() {
   if (!current.value) return
   const markdown = operationForLlm({
      title: document.value?.info?.title,
      method: current.value.method,
      route: current.value.route,
      summary: current.value.operation.summary,
      description: current.value.operation.description,
      parameters: parameters.value,
      requestSchema: request.value?.schemaName || request.value?.typeLabel,
      requestExample: request.value?.example,
      responses: responses.value.map((response) => ({ status: response.status, description: response.description, schemaName: response.schemaName, typeLabel: response.typeLabel }))
   })
   await navigator.clipboard.writeText(markdown)
   toast.add({ severity: 'success', summary: 'Copié', detail: 'Le résumé pour assistant a été copié.', life: 2200 })
}
</script>
