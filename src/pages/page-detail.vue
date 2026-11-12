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
            <Button class="info-btn" icon="pi pi-info-circle" text rounded size="small" aria-label="Route information" v-tooltip.bottom="'Route info'" @click="toggleRouteInfo" />
            <Button class="copy-btn" icon="pi pi-copy" text rounded size="small" aria-label="Copy path" @click="copyPath" />
         </div>

         <Popover ref="routeInfoPopover" class="route-info-popover">
            <div class="route-context-box">
               <div class="route-context-item">
                  <span class="context-label"><i class="pi pi-server"></i> Server URL:</span>
                  <span class="context-content">
                     Constructed as <code>https://{env}.api.appcluster01.{region}.ezmax.com/rest</code> (or <code>https://{env}.api.global.ezmax.com</code> for global endpoints).
                  </span>
               </div>
               <div v-if="security.length" class="route-context-item">
                  <span class="context-label"><i class="pi pi-shield"></i> Authentication:</span>
                  <span class="context-content">
                     Requires <code>Authorization: Bearer &lt;token&gt;</code> or eZmax API Key (<code>Ezmax-Date</code>, <code>Ezmax-Fingerprint</code>, <code>Ezmax-Signature</code> HMAC-SHA256 request signing).
                  </span>
               </div>
            </div>
         </Popover>

         <XMarkdown v-if="current.operation.description" class="description" :source="current.operation.description" />

         <section v-if="extensions.lists.length || extensions.flags.length || extensions.texts.length" class="section-card">
            <div class="section-head">
               <button type="button" class="fold" :aria-expanded="advancedOpen" @click="advancedOpen = !advancedOpen">
                  <span class="caret-disc"><span class="caret" :class="{ open: advancedOpen }"></span></span>
                  <span>Advanced properties</span>
               </button>
            </div>
            <div v-show="advancedOpen" class="advanced-grid">
               <article v-for="flag in extensions.flags" :key="flag.key">
                  <h3>{{ flag.label }}</h3>
                  <ul>
                     <li>true</li>
                  </ul>
               </article>
               <article v-for="text in extensions.texts" :key="text.key">
                  <h3>{{ text.label }}</h3>
                  <ul>
                     <li>{{ text.value }}</li>
                  </ul>
               </article>
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
               <button type="button" class="fold" :aria-expanded="expanded[section.in] ?? true" @click="toggleExpand(section.in)">
                  <span class="caret-disc"><span class="caret" :class="{ open: expanded[section.in] ?? true }"></span></span>
                  <span>{{ section.title }}</span>
               </button>
            </div>
            <XSchemaTree v-show="expanded[section.in] ?? true" :nodes="section.nodes" :expanded="expanded[section.in] ?? true" :expand-token="tokens[section.in] ?? 0" />
         </section>

         <section v-if="request" class="section-card">
            <div class="section-head">
               <button type="button" class="fold" :aria-expanded="expanded.request" @click="toggleExpand('request', filteredRequest)">
                  <span class="caret-disc"><span class="caret" :class="{ open: expanded.request }"></span></span>
                  <span>Request body <small v-if="request.required">required</small></span>
               </button>
               <button v-if="store.showObjectNames && request.schemaName" type="button" class="schema-anchor" @click="openSchema(request.schemaName)">{{ request.schemaName }}</button>
               <span v-else-if="store.showObjectNames && request.typeLabel" class="schema-anchor plain">{{ request.typeLabel }}</span>
               <Select v-if="request.contentTypes.length > 1" :model-value="contentType || request.contentType" :options="request.contentTypes" class="content-select" @update:model-value="contentType = $event" />
               <div class="section-tools">
                  <button type="button" class="explorer-toggle required-toggle" :class="{ active: requiredOnlyRequest }" :aria-pressed="requiredOnlyRequest" @click="requiredOnlyRequest = !requiredOnlyRequest"><span class="required-switch" aria-hidden="true"></span>Only Required Field</button>
                  <IconField class="filter-field">
                     <InputIcon class="pi pi-search" />
                     <InputText v-model="filterRequest" placeholder="Filter" size="small" />
                     <button v-if="filterRequest" type="button" class="search-clear" aria-label="Clear filter" @click="filterRequest = ''">
                        <i class="pi pi-times"></i>
                     </button>
                  </IconField>
               </div>
            </div>
            <div v-show="showSectionContent('request', filteredRequest)">
               <p v-if="request.description" class="section-note">{{ request.description }}</p>
               <p v-if="request.stream" class="section-note">Stream of items (itemSchema).</p>
               <XSchemaTree :nodes="filteredRequest" :expanded="expanded.request" :expand-token="tokens.request" />
            </div>
         </section>

         <section v-if="responseNodes.length" class="section-card">
            <div class="section-head">
               <button type="button" class="fold" :aria-expanded="expanded.response" @click="toggleExpand('response', filteredResponse)">
                  <span class="caret-disc"><span class="caret" :class="{ open: expanded.response }"></span></span>
                  <span>Responses</span>
               </button>
               <div class="section-tools">
                  <button type="button" class="explorer-toggle required-toggle" :class="{ active: requiredOnlyResponse }" :aria-pressed="requiredOnlyResponse" @click="requiredOnlyResponse = !requiredOnlyResponse"><span class="required-switch" aria-hidden="true"></span>Only Required Field</button>
                  <IconField class="filter-field">
                     <InputIcon class="pi pi-search" />
                     <InputText v-model="filterResponse" placeholder="Filter" size="small" />
                     <button v-if="filterResponse" type="button" class="search-clear" aria-label="Clear filter" @click="filterResponse = ''">
                        <i class="pi pi-times"></i>
                     </button>
                  </IconField>
               </div>
            </div>
            <XSchemaTree v-show="showSectionContent('response', filteredResponse)" :nodes="filteredResponse" :expanded="expanded.response" :expand-token="tokens.response" />
         </section>

         <section v-if="callbacks.length" class="section-card">
            <div class="section-head"><h3>Callbacks</h3></div>
            <article v-for="callback in callbacks" :key="callback.name + callback.expression" class="callback">
               <div class="path-bar compact">
                  <span class="method" :class="'m-' + callback.method">{{ callback.method }}</span>
                  <code>{{ callback.name }}</code>
               </div>
               <p class="section-note">{{ callback.expression }}</p>
               <XMarkdown v-if="callback.description" class="description" :source="callback.description" />
               <XSchemaTree v-if="callback.body" :nodes="callback.body.nodes" />
            </article>
         </section>
      </div>

      <div class="samples-slot">
         <XSamplesPanel :method="current.method" :route="current.route" :webhook="current.webhook" :servers="servers" :environment-values="environmentValues" :region-values="regionValues" :security="security" :parameters="parameters" :request-example="request?.example" :responses="sampleResponses" :code-samples="codeSamples" />
      </div>
   </article>

   <article v-else-if="isTagView" class="page">
      <header class="page-header">
         <p class="kicker">Tag</p>
         <h2>{{ tagTitle }}</h2>
      </header>
      <XMarkdown v-if="tagDescription" class="description" :source="tagDescription" />
      <div class="tag-operations">
         <RouterLink v-for="operation in tagOperations" :key="operation.method + operation.operationId" class="op-row" :title="operation.route" :to="{ name: 'page-details', params: { object: tagName, operation: operation.operationId } }">
            <span class="method" :class="'m-' + operation.method">{{ operation.method }}</span>
            <span class="op-label" :class="{ strike: operation.deprecated }">{{ operation.summary }}</span>
         </RouterLink>
         <p v-if="!tagOperations.length" class="section-note">No operations for this tag.</p>
      </div>
   </article>

   <article v-else class="page">
      <XNotFound :missing="notFoundTarget" />
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
import Popover from 'primevue/popover'
import { useToast } from 'primevue/usetoast'
import XMarkdown from 'src/components/markdown-view/x-markdown.vue'
import XSamplesPanel from 'src/components/samples-panel/x-samples-panel.vue'
import XSchemaTree from 'src/components/schema-tree/x-schema-tree.vue'
import XNotFound from 'src/components/not-found/x-not-found.vue'
import { useOpenApi } from 'src/composables/use-openapi'
import { useSchemaDialog } from 'src/composables/use-schema-dialog'
import { useGlobalStore } from 'src/stores/global'
import { buildNav, findOperation, findWebhook } from 'src/utils/nav'
import { flagSeverity, formatTag, vendorExtensions } from 'src/utils/openapi'
import { chooseServers, groupNameForTag, infrastructureEnvironmentValues, infrastructureRegionValues, operationForLlm, securityOptions, serverOptions } from 'src/utils/samples'
import { bodyModel, callbackModels, filterNodes, listParameters, parameterSections, responseModels, statusTone, type SchemaNode } from 'src/utils/schema-tree'

const route = useRoute()
const toast = useToast()
const store = useGlobalStore()
const { document } = useOpenApi()
const openSchema = useSchemaDialog() || (() => undefined)

const routeInfoPopover = ref<any>()

function toggleRouteInfo(event: Event) {
   routeInfoPopover.value?.toggle(event)
}

const contentType = ref('')
const filterRequest = ref('')
const filterResponse = ref('')
const requiredOnlyRequest = ref(false)
const requiredOnlyResponse = ref(false)
const advancedOpen = ref(store.showProperties)
const expanded = reactive<Record<string, boolean>>({ path: true, query: true, header: true, cookie: true, request: true, response: true })
const tokens = reactive<Record<string, number>>({ path: 0, query: 0, header: 0, cookie: 0, request: 0, response: 0 })

const tagName = computed(() => (route.name === 'page-details' && typeof route.params.object === 'string' ? route.params.object : ''))
const tagObject = computed(() => document.value?.tags?.find((tag: any) => tag.name === tagName.value))
const tagTitle = computed(() => tagObject.value?.['x-displayName'] || (tagName.value ? formatTag(tagName.value) : ''))
const tagDescription = computed(() => tagObject.value?.description || '')

const current = computed(() => {
   if (!document.value) return undefined
   if (route.name === 'webhook') return findWebhook(document.value, String(route.params.name || ''))
   if (typeof route.params.operation === 'string') {
      const found = findOperation(document.value, route.params.operation)
      if (!found) return undefined
      if (typeof route.params.object === 'string' && route.params.object) {
         const opTags: string[] = found.operation.tags?.length ? found.operation.tags : ['default']
         const matchesTag = opTags.some((t) => t.toLowerCase() === (route.params.object as string).toLowerCase())
         if (!matchesTag) return undefined
      }
      return found
   }
   return undefined
})

const extensions = computed(() => vendorExtensions(current.value?.operation))
const parameters = computed(() => (current.value ? listParameters(current.value.pathItem, current.value.operation, document.value) : []))
const parameterBlocks = computed(() => parameterSections(parameters.value))
const request = computed(() => (current.value ? bodyModel(current.value.operation.requestBody, document.value, contentType.value || undefined) : undefined))
const responses = computed(() => (current.value ? responseModels(current.value.operation.responses, document.value) : []))
const callbacks = computed(() => (current.value?.operation?.callbacks ? callbackModels(current.value.operation.callbacks, document.value) : []))
const serversRaw = computed(() => chooseServers(document.value, current.value?.pathItem, current.value?.operation, groupNameForTag(document.value, tagName.value)))
const servers = computed(() => serverOptions(serversRaw.value))
/** Union of `sInfrastructureenvironmenttypeDescription.enum` across root `servers` (canonical list), not the per-route subset from chooseServers. */
const environmentValues = computed(() => infrastructureEnvironmentValues(document.value?.servers))
/** Union of `sInfrastructureregionCode.enum` across root `servers`. */
const regionValues = computed(() => infrastructureRegionValues(document.value?.servers))
const security = computed(() => securityOptions(current.value?.operation?.security !== undefined ? current.value.operation.security : document.value?.security, document.value?.components?.securitySchemes))
const codeSamples = computed(() => current.value?.operation?.['x-codeSamples'] || current.value?.operation?.['x-code-samples'] || [])

const responseNodes = computed<SchemaNode[]>(() =>
   responses.value.map((response) => ({
      key: response.status,
      label: response.status,
      labelTone: statusTone(response.status),
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
      extensions: [],
      note: [response.contentType, response.stream ? 'stream' : '', response.headers.length ? `Headers: ${response.headers.map((header) => header.name).join(', ')}` : '', response.links.length ? `Links: ${response.links.map((link) => link.name).join(', ')}` : '', response.others.length ? `Also: ${response.others.join(', ')}` : ''].filter(Boolean).join(' · '),
      children: response.nodes
   }))
)

const filteredRequest = computed(() => filterNodes(request.value?.nodes || [], filterRequest.value.trim().toLowerCase(), requiredOnlyRequest.value))
const filteredResponse = computed(() => filterNodes(responseNodes.value, filterResponse.value.trim().toLowerCase(), requiredOnlyResponse.value))
const sampleResponses = computed(() => responses.value.map((response) => ({ status: response.status, description: response.description, example: response.example })))
const tagOperations = computed(() => {
   const model = document.value ? buildNav(document.value) : undefined
   return (model?.byTag[tagName.value] || []).filter((operation) => store.showDeprecated || !operation.deprecated)
})

const isTagView = computed(() => {
   if (route.params.operation) return false
   return Boolean(tagName.value && (tagOperations.value.length > 0 || tagObject.value))
})

const notFoundTarget = computed(() => {
   if (typeof route.params.object === 'string' && typeof route.params.operation === 'string') {
      return `${route.params.object}/${route.params.operation}`
   }
   if (typeof route.params.operation === 'string') return route.params.operation
   if (typeof route.params.object === 'string') return route.params.object
   if (typeof route.params.name === 'string') return route.params.name
   return route.fullPath
})

watch(
   () => [route.params.operation, route.params.name, route.params.object],
   () => {
      contentType.value = ''
      filterRequest.value = ''
      filterResponse.value = ''
      requiredOnlyRequest.value = false
      requiredOnlyResponse.value = false
      advancedOpen.value = store.showProperties
      expanded.path = true
      expanded.query = true
      expanded.header = true
      expanded.cookie = true
      expanded.request = true
      expanded.response = true
   }
)

watch(
   () => store.showProperties,
   (val) => {
      advancedOpen.value = val
   }
)

function hasNestedTrees(nodes?: SchemaNode[]): boolean {
   if (!nodes || !nodes.length) return false
   return nodes.some((node) => node.children.length > 0)
}

function showSectionContent(section: string, nodes?: SchemaNode[]): boolean {
   if (hasNestedTrees(nodes)) return true
   return expanded[section] ?? true
}

function toggleExpand(section: string, nodes?: SchemaNode[]) {
   expanded[section] = !(expanded[section] ?? true)
   tokens[section] = (tokens[section] ?? 0) + 1
}

async function copyPath() {
   await navigator.clipboard.writeText(current.value?.route || '')
   toast.add({ severity: 'success', summary: 'Copied', detail: 'The route path was copied.', life: 2200 })
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
   toast.add({ severity: 'success', summary: 'Copied', detail: 'The assistant summary was copied.', life: 2200 })
}
</script>
