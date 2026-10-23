<template>
   <button v-if="!store.samplesOpen" type="button" class="samples-launcher" @click="store.samplesOpen = true">
      <i class="pi pi-code"></i>
      Samples
   </button>
   <aside v-else class="samples" :class="{ overlay: store.samplesOverlay }">
      <div class="samples-head">
         <h2>Samples</h2>
         <div class="sample-actions">
            <Button class="copy-btn" icon="pi pi-copy" label="cURL" size="small" text @click="copy(curl, 'cURL copié')" />
            <Button :icon="store.samplesOverlay ? 'pi pi-arrow-left' : 'pi pi-clone'" text rounded size="small" :aria-label="store.samplesOverlay ? 'Dock beside content' : 'Float over content'" v-tooltip.left="store.samplesOverlay ? 'Dock beside content' : 'Float over content'" @click="store.samplesOverlay = !store.samplesOverlay" />
            <Button icon="pi pi-times" text rounded size="small" aria-label="Close samples" @click="store.samplesOpen = false" />
         </div>
      </div>

      <p v-if="webhook" class="samples-note">Webhook entrant. L'exemple décrit la charge que eZmax envoie.</p>

      <template v-if="!webhook && servers.length">
         <label class="field-label">Server</label>
         <Select v-model="serverIndex" :options="serverChoices" option-label="label" option-value="value" class="samples-select" />
         <p v-if="servers[serverIndex]?.description" class="samples-note">{{ servers[serverIndex].description }}</p>
      </template>

      <template v-if="security.length > 1">
         <label class="field-label">Security</label>
         <Select v-model="securityIndex" :options="securityChoices" option-label="label" option-value="value" class="samples-select" />
      </template>
      <p v-else-if="security[0]" class="samples-note">Auth · {{ security[0].label }}</p>

      <div v-for="sample in codeSamples" :key="sample.lang + sample.source" class="sample-block">
         <div class="sample-label">{{ sample.lang || sample.label || 'sample' }}</div>
         <pre><code class="hljs" v-html="highlighted(sample.source, sample.lang || 'plaintext')"></code></pre>
      </div>

      <div class="sample-block">
         <div class="sample-label">cURL</div>
         <pre><code class="hljs language-bash" v-html="highlighted(curl, 'bash')"></code></pre>
      </div>

      <div v-if="requestExample !== undefined" class="sample-block">
         <div class="sample-toolbar">
            <span class="sample-label">Request</span>
            <div class="sample-actions">
               <button type="button" class="explorer-toggle" :class="{ active: store.jsonExplorer }" :aria-pressed="store.jsonExplorer" @click="store.jsonExplorer = !store.jsonExplorer">Explorer</button>
               <Button class="copy-btn" icon="pi pi-copy" size="small" text rounded aria-label="Copy request" @click="copy(prettyJson(requestExample), 'Exemple de requête copié')" />
            </div>
         </div>
         <div v-if="store.jsonExplorer" class="json-explorer">
            <XJsonNode :value="requestExample" :depth="0" />
         </div>
         <pre v-else><code class="hljs language-json" v-html="highlighted(prettyJson(requestExample), 'json')"></code></pre>
      </div>

      <template v-if="responses.length">
         <label class="field-label">Response</label>
         <Select v-model="responseStatus" :options="responses" option-label="status" option-value="status" class="samples-select" />
         <p v-if="activeResponse?.description" class="samples-note">{{ activeResponse.description }}</p>
         <div v-if="activeResponse?.example !== undefined" class="sample-block">
            <div class="sample-toolbar">
               <span class="sample-label">{{ activeResponse.status }}</span>
               <div class="sample-actions">
                  <button type="button" class="explorer-toggle" :class="{ active: store.jsonExplorer }" :aria-pressed="store.jsonExplorer" @click="store.jsonExplorer = !store.jsonExplorer">Explorer</button>
                  <Button class="copy-btn" icon="pi pi-copy" size="small" text rounded aria-label="Copy response" @click="copy(prettyJson(activeResponse.example), 'Exemple de réponse copié')" />
               </div>
            </div>
            <div v-if="store.jsonExplorer" class="json-explorer">
               <XJsonNode :value="activeResponse.example" :depth="0" />
            </div>
            <pre v-else><code class="hljs language-json" v-html="highlighted(prettyJson(activeResponse.example), 'json')"></code></pre>
         </div>
      </template>
   </aside>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import hljs from 'highlight.js/lib/core'
import bash from 'highlight.js/lib/languages/bash'
import json from 'highlight.js/lib/languages/json'
import Button from 'primevue/button'
import Select from 'primevue/select'
import { useToast } from 'primevue/usetoast'
import XJsonNode from 'src/components/samples-panel/x-json-node.vue'
import { useGlobalStore } from 'src/stores/global'

hljs.registerLanguage('json', json)
hljs.registerLanguage('bash', bash)
import { applyPathParams, buildCurl, joinUrl, prettyJson, type SecurityOption, type ServerOption } from 'src/utils/samples'
import type { FlatParameter } from 'src/utils/schema-tree'

const props = defineProps<{
   method: string
   route: string
   webhook?: boolean
   servers: ServerOption[]
   security: SecurityOption[]
   parameters: FlatParameter[]
   requestExample?: unknown
   responses: { status: string; description: string; example?: unknown }[]
   codeSamples?: { lang?: string; label?: string; source: string }[]
}>()

const toast = useToast()
const store = useGlobalStore()
const serverIndex = ref(0)
const securityIndex = ref(0)
const responseStatus = ref(props.responses[0]?.status || '')

watch(
   () => props.responses,
   (responses) => {
      if (!responses.some((response) => response.status === responseStatus.value)) responseStatus.value = responses.find((response) => response.status.startsWith('2'))?.status || responses[0]?.status || ''
   }
)

watch(
   () => props.route,
   () => {
      serverIndex.value = 0
      securityIndex.value = 0
   }
)

const serverChoices = computed(() => props.servers.map((server, index) => ({ label: server.resolved || server.url, value: index })))
const securityChoices = computed(() => props.security.map((option, index) => ({ label: option.label, value: index })))
const activeSecurity = computed(() => props.security[securityIndex.value] || props.security[0])
const activeResponse = computed(() => props.responses.find((response) => response.status === responseStatus.value))

const curl = computed(() => {
   const server = props.servers[serverIndex.value]?.resolved || ''
   const path = applyPathParams(props.route, props.parameters)
   const query: Record<string, string> = { ...(activeSecurity.value?.query || {}) }
   for (const parameter of props.parameters) {
      if (parameter.in !== 'query' || !parameter.required) continue
      const raw = parameter.example !== undefined ? String(parameter.example) : `{${parameter.name}}`
      query[parameter.name] = raw
   }
   return buildCurl({
      method: props.method,
      url: props.webhook ? props.route : joinUrl(server, path),
      headers: activeSecurity.value?.headers || {},
      query,
      body: props.requestExample
   })
})

function highlighted(code: string, language: string) {
   if (!hljs.getLanguage(language)) return escapeHtml(code)
   const html = hljs.highlight(code, { language, ignoreIllegals: true }).value
   if (language !== 'bash') return html
   return html
      .replace(/^curl\b/, '<span class="hljs-built_in">curl</span>')
      .replace(/(<\/span>)( -X )(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS|QUERY|TRACE)/, '$1<span class="hljs-meta">$2</span><span class="hljs-literal">$3</span>')
      .replace(/(\n\s*)(-{1,2}[A-Za-z][\w-]*)/g, '$1<span class="hljs-meta">$2</span>')
}

function escapeHtml(value: string) {
   return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

async function copy(value: string, detail: string) {
   await navigator.clipboard.writeText(value)
   toast.add({ severity: 'success', summary: 'Copié', detail, life: 2200 })
}
</script>
