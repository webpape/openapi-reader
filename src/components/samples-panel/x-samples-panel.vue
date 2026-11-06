<template>
   <button v-if="!store.samplesOpen" type="button" class="samples-launcher" @click="store.samplesOpen = true">
      <i class="pi pi-code"></i>
      Samples
   </button>
   <aside v-else class="samples">
      <div class="samples-head">
         <h2>Samples</h2>
         <div class="sample-actions">
            <Button
               v-if="!webhook && servers.length"
               size="small"
               severity="secondary"
               class="samples-try-open"
               :disabled="trySending"
               aria-label="Try request (beta)"
               @click="openTryModal"
            >
               <span class="samples-try-label">Try</span>
               <span class="beta-badge samples-try-beta" aria-hidden="true">beta</span>
            </Button>
            <Button icon="pi pi-times" text rounded size="small" aria-label="Close samples" @click="store.samplesOpen = false" />
         </div>
      </div>

      <p v-if="webhook" class="samples-note">Webhook entrant. L'exemple décrit la charge que eZmax envoie.</p>

      <template v-if="!webhook && environments.length">
         <label class="field-label">Environment</label>
         <div class="env-pills" role="radiogroup" aria-label="Environment">
            <button v-for="env in environments" :key="env" type="button" class="env-pill" role="radio" :class="{ active: store.sampleEnvironment === env }" :aria-checked="store.sampleEnvironment === env" @click="store.sampleEnvironment = env">{{ env }}</button>
         </div>
      </template>

      <template v-if="!webhook && servers.length">
         <label class="field-label">Server</label>
         <Select v-if="servers.length > 1" v-model="serverIndex" :options="serverChoices" option-label="label" option-value="value" class="samples-select" />
         <div class="server-url">
            <code>{{ fullUrl }}</code>
            <Button class="copy-btn" icon="pi pi-copy" size="small" text rounded aria-label="Copy URL" @click="copy(fullUrl, 'URL copiée')" />
         </div>
         <p v-if="activeServer?.description" class="samples-note">{{ activeServer.description }}</p>
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
         <div class="sample-toolbar">
            <span class="sample-label">cURL</span>
            <div class="sample-actions">
               <Button class="copy-btn" icon="pi pi-copy" size="small" text rounded aria-label="Copy cURL" @click="copy(curl, 'cURL copié')" />
            </div>
         </div>
         <pre><code class="hljs language-bash" v-html="highlighted(curl, 'bash')"></code></pre>
      </div>

      <div v-if="requestExample !== undefined" class="sample-block">
         <div class="sample-toolbar">
            <span class="sample-label">Request</span>
            <div class="sample-actions">
               <button type="button" class="explorer-toggle" :class="{ active: store.jsonExplorer }" :aria-pressed="store.jsonExplorer" @click="store.jsonExplorer = !store.jsonExplorer">JSON Explorer</button>
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
                  <button type="button" class="explorer-toggle" :class="{ active: store.jsonExplorer }" :aria-pressed="store.jsonExplorer" @click="store.jsonExplorer = !store.jsonExplorer">JSON Explorer</button>
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

   <Dialog
      v-model:visible="tryVisible"
      modal
      dismissable-mask
      :closable="true"
      class="try-request-dialog"
      :class="{ 'try-request-dialog--split': trySplitLayout }"
      :style="{ width: tryDialogWidth }"
      :content-style="tryDialogContentStyle"
      :block-scroll="true"
      @show="onTryShow"
   >
      <template #header>
         <div class="try-dialog-head">
            <div class="try-dialog-title-row">
               <span class="try-dialog-title">Try request</span>
               <span class="beta-badge try-dialog-beta" aria-label="Beta">beta</span>
               <button
                  type="button"
                  class="try-split-layout-toggle"
                  :class="{ active: trySplitLayout }"
                  :aria-pressed="trySplitLayout"
                  :aria-label="trySplitLayout ? 'Passer à la disposition empilée' : 'Passer à la disposition côte à côte'"
                  :title="trySplitLayout ? 'Disposition empilée' : 'Côte à côte'"
                  @click="trySplitLayout = !trySplitLayout"
               >
                  <i class="pi" :class="trySplitLayout ? 'pi-bars' : 'pi-th-large'" aria-hidden="true" />
               </button>
            </div>
         </div>
      </template>
      <div class="try-dialog-body" :class="{ 'try-dialog-body--split': trySplitLayout }">
         <div class="try-dialog-request">
            <label class="field-label" for="try-api-key">API key</label>
            <div class="try-api-key-row">
               <InputText
                  id="try-api-key"
                  v-model="tryApiKey"
                  fluid
                  class="try-api-key"
                  :class="{ 'try-api-key--masked': !tryApiKeyReveal }"
                  placeholder="Paste Bearer token or API key"
                  autocomplete="off"
                  autocorrect="off"
                  autocapitalize="off"
                  spellcheck="false"
                  name="or-try-token"
                  data-form-type="other"
                  data-lpignore="true"
                  data-1p-ignore
                  data-bwignore
               />
               <Button
                  type="button"
                  :icon="tryApiKeyReveal ? 'pi pi-eye-slash' : 'pi pi-eye'"
                  severity="secondary"
                  text
                  rounded
                  class="try-api-key-reveal"
                  :aria-label="tryApiKeyReveal ? 'Masquer la clé' : 'Afficher la clé'"
                  :aria-pressed="tryApiKeyReveal"
                  @click="tryApiKeyReveal = !tryApiKeyReveal"
               />
            </div>

            <template v-if="!webhook && environments.length">
               <label class="field-label">Environment</label>
               <div class="env-pills try-env-pills" role="radiogroup" aria-label="Environment">
                  <button
                     v-for="env in environments"
                     :key="env"
                     type="button"
                     class="env-pill"
                     role="radio"
                     :class="{ active: tryDialogEnvironment === env }"
                     :aria-checked="tryDialogEnvironment === env"
                     @click="tryDialogEnvironment = env"
                  >
                     {{ env }}
                  </button>
               </div>
            </template>

            <div v-if="!webhook && servers.length" class="try-dialog-method-route">
               <span class="method try-dialog-method" :class="'m-' + method">{{ method }}</span>
               <code class="try-dialog-url-preview">{{ tryDialogFullUrl }}</code>
            </div>

            <template v-if="showTryRequestBody">
               <label class="field-label" for="try-body-json">Request body (JSON)</label>
               <textarea id="try-body-json" v-model="tryBodyJson" class="try-body-textarea" spellcheck="false" rows="12" placeholder="{}" />
            </template>

            <template v-if="!webhook && pathParamNames.length">
               <label class="field-label">Path parameters</label>
               <div class="try-path-params">
                  <div v-for="name in pathParamNames" :key="name" class="try-path-param-row">
                     <label class="try-path-param-label" :for="'try-path-' + name">{{ name }}</label>
                     <InputText :id="'try-path-' + name" v-model="tryPathParamValues[name]" fluid class="try-path-param-input" :placeholder="'{' + name + '}'" autocomplete="off" />
                  </div>
               </div>
            </template>

            <div class="try-dialog-actions">
               <Button label="Send" icon="pi pi-send" :loading="trySending" :disabled="trySendDisabled" @click="sendTryRequest" />
            </div>
         </div>

         <div
            v-show="trySplitLayout || tryError || tryResponse"
            class="try-dialog-response-column"
            :class="{ 'try-dialog-response-column--split': trySplitLayout }"
         >
            <div v-if="tryError" class="try-response try-response-error" role="alert">
               <div class="try-response-label">Error</div>
               <pre class="try-response-pre">{{ tryError }}</pre>
            </div>
            <div v-else-if="tryResponse" class="try-response" :class="{ 'try-response-ok': tryResponse.ok }">
               <div class="try-response-meta">
                  <span class="try-response-status" :class="tryResponse.ok ? 'ok' : 'err'">{{ tryResponse.status }} {{ tryResponse.statusText }}</span>
                  <div v-if="tryResponseParsedJson !== null" class="try-response-meta-actions">
                     <button
                        type="button"
                        class="explorer-toggle"
                        :class="{ active: tryResponseJsonExplorer }"
                        :aria-pressed="tryResponseJsonExplorer"
                        @click="tryResponseJsonExplorer = !tryResponseJsonExplorer"
                     >
                        JSON Explorer
                     </button>
                     <Button class="copy-btn" icon="pi pi-copy" size="small" text rounded aria-label="Copy response" @click="copy(tryResponseBodyFormatted, 'Réponse copiée')" />
                  </div>
               </div>
               <div v-if="tryResponseParsedJson !== null" class="json-explorer try-response-json-explorer" role="region" aria-label="Response body">
                  <XJsonNode v-if="tryResponseJsonExplorer" :value="tryResponseParsedJson" :depth="0" />
                  <pre v-else class="try-response-pre try-response-pre--raw"><code class="hljs language-json" v-html="highlighted(tryResponseBodyFormatted, 'json')"></code></pre>
               </div>
               <pre v-else class="try-response-pre">{{ tryResponseBodyFormatted }}</pre>
            </div>
            <div v-else-if="trySplitLayout" class="try-response try-response-empty" role="status" aria-live="polite">
               <div class="try-response-label">Response</div>
               <p class="try-response-empty-hint">Envoyez une requête pour voir la réponse ici.</p>
            </div>
         </div>
      </div>
   </Dialog>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import hljs from 'highlight.js/lib/core'
import bash from 'highlight.js/lib/languages/bash'
import json from 'highlight.js/lib/languages/json'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import { useToast } from 'primevue/usetoast'
import XJsonNode from 'src/components/samples-panel/x-json-node.vue'
import { useGlobalStore } from 'src/stores/global'
import {
   applyPathParams,
   buildCurl,
   buildPathWithParamValues,
   coalesceEnvironmentChoice,
   defaultPathParamValues,
   joinUrl,
   pathTemplateParamNames,
   prettyJson,
   serverUrlForEnvironment,
   type SecurityOption,
   type ServerOption
} from 'src/utils/samples'
import type { FlatParameter } from 'src/utils/schema-tree'

hljs.registerLanguage('json', json)
hljs.registerLanguage('bash', bash)

const TRY_API_KEY_SESSION_KEY = 'or-try-api-key'
function readTryApiKeyFromSession(): string {
   if (typeof sessionStorage === 'undefined') return ''
   try {
      return sessionStorage.getItem(TRY_API_KEY_SESSION_KEY) ?? ''
   } catch {
      return ''
   }
}
function writeTryApiKeyToSession(value: string) {
   if (typeof sessionStorage === 'undefined') return
   try {
      sessionStorage.setItem(TRY_API_KEY_SESSION_KEY, value)
   } catch {
      /* quota / private mode */
   }
}

const TRY_SPLIT_LAYOUT_SESSION_KEY = 'or-try-split-layout'
function readTrySplitLayoutFromSession(): boolean {
   if (typeof sessionStorage === 'undefined') return false
   try {
      return sessionStorage.getItem(TRY_SPLIT_LAYOUT_SESSION_KEY) === '1'
   } catch {
      return false
   }
}
function writeTrySplitLayoutToSession(value: boolean) {
   if (typeof sessionStorage === 'undefined') return
   try {
      sessionStorage.setItem(TRY_SPLIT_LAYOUT_SESSION_KEY, value ? '1' : '0')
   } catch {
      /* quota / private mode */
   }
}

const TRY_ROUTE_STATES_KEY = 'or-try-route-states'

interface TryRoutePersisted {
   pathParams?: Record<string, string>
   bodyJson?: string
   environment?: string
}

function readAllTryRouteStates(): Record<string, TryRoutePersisted> {
   if (typeof sessionStorage === 'undefined') return {}
   try {
      const raw = sessionStorage.getItem(TRY_ROUTE_STATES_KEY)
      if (!raw) return {}
      const parsed = JSON.parse(raw) as Record<string, TryRoutePersisted>
      return parsed && typeof parsed === 'object' ? parsed : {}
   } catch {
      return {}
   }
}

function writeTryRouteStates(states: Record<string, TryRoutePersisted>) {
   if (typeof sessionStorage === 'undefined') return
   try {
      sessionStorage.setItem(TRY_ROUTE_STATES_KEY, JSON.stringify(states))
   } catch {
      /* quota / private mode */
   }
}

const props = defineProps<{
   method: string
   route: string
   webhook?: boolean
   servers: ServerOption[]
   /** Distinct infrastructure environment values from spec server variables (e.g. dev, qa, stg, prod, iso) */
   environmentValues: string[]
   security: SecurityOption[]
   parameters: FlatParameter[]
   requestExample?: unknown
   responses: { status: string; description: string; example?: unknown }[]
   codeSamples?: { lang?: string; label?: string; source: string }[]
}>()

const toast = useToast()
const store = useGlobalStore()
const environments = computed(() => props.environmentValues)

const tryVisible = ref(false)
const tryBodyJson = ref('{}')
const tryApiKey = ref(readTryApiKeyFromSession())
/** Side-by-side request / response layout (sessionStorage) */
const trySplitLayout = ref(readTrySplitLayoutFromSession())
const tryDialogWidth = computed(() => (trySplitLayout.value ? 'min(1400px, 98vw)' : 'min(1100px, 96vw)'))
const tryDialogContentStyle = computed(() =>
   trySplitLayout.value
      ? { maxHeight: 'min(88vh, 920px)', overflow: 'hidden', padding: '0', display: 'flex', flexDirection: 'column', minHeight: '0' }
      : { maxHeight: 'min(85vh, 900px)', overflow: 'auto', padding: '0' }
)
/** When false, API key is masked with CSS (not type=password) to avoid browser save-password prompts */
const tryApiKeyReveal = ref(false)
const trySending = ref(false)
const tryError = ref('')
const tryResponse = ref<{ ok: boolean; status: number; statusText: string; body: string } | null>(null)
/** Try dialog: tree view for JSON response (same UX as Samples panel) */
const tryResponseJsonExplorer = ref(true)

const methodAcceptsBody = computed(() => {
   const m = props.method.toLowerCase()
   return ['post', 'put', 'patch', 'delete'].includes(m)
})

const showTryRequestBody = computed(() => props.requestExample !== undefined)

const pathParamNames = computed(() => (props.webhook ? [] : pathTemplateParamNames(props.route)))

const tryPathParamValues = ref<Record<string, string>>({})
/** Environment for Try modal only (per-route persistence in sessionStorage) */
const tryDialogEnvironment = ref('')

const tryStateKey = computed(() => `${props.method.toUpperCase()}:${props.route}`)

function persistTryRouteStateForKey(
   stateKey: string,
   pathParams: Record<string, string>,
   bodyJson: string,
   environment: string,
   hasRequestBody: boolean
) {
   if (props.webhook) return
   const all = readAllTryRouteStates()
   const entry: TryRoutePersisted = {
      pathParams: { ...pathParams },
      environment
   }
   if (hasRequestBody) entry.bodyJson = bodyJson
   all[stateKey] = entry
   writeTryRouteStates(all)
}

function persistTryRouteState() {
   persistTryRouteStateForKey(tryStateKey.value, tryPathParamValues.value, tryBodyJson.value, tryDialogEnvironment.value, showTryRequestBody.value)
}

/** Refs match session for this key; used to avoid persisting empty state when switching routes before first hydrate */
let lastHydratedTryStateKey: string | null = null

function hydrateTryFormFromSession() {
   const key = tryStateKey.value
   const saved = readAllTryRouteStates()[key]
   const defaults = defaultPathParamValues(props.route, props.parameters)
   const mergedPath: Record<string, string> = { ...defaults }
   if (saved?.pathParams) {
      for (const name of pathTemplateParamNames(props.route)) {
         if (saved.pathParams[name] !== undefined && saved.pathParams[name] !== '') mergedPath[name] = saved.pathParams[name]!
      }
   }
   tryPathParamValues.value = mergedPath

   if (showTryRequestBody.value) {
      if (saved?.bodyJson !== undefined && saved.bodyJson !== '') tryBodyJson.value = saved.bodyJson
      else if (props.requestExample !== undefined) tryBodyJson.value = prettyJson(props.requestExample)
      else tryBodyJson.value = '{\n  \n}'
   } else {
      tryBodyJson.value = '{}'
   }

   tryDialogEnvironment.value = coalesceEnvironmentChoice(props.environmentValues, saved?.environment ?? store.sampleEnvironment)
   lastHydratedTryStateKey = key
}

const trySendDisabled = computed(() => trySending.value || props.webhook || !props.servers.length)

const tryResponseBodyFormatted = computed(() => {
   if (!tryResponse.value?.body) return ''
   const t = tryResponse.value.body.trim()
   try {
      return JSON.stringify(JSON.parse(t), null, 2)
   } catch {
      return tryResponse.value.body
   }
})

/** Parsed JSON for XJsonNode; null if body is not valid JSON */
const tryResponseParsedJson = computed((): unknown | null => {
   if (!tryResponse.value?.body) return null
   const t = tryResponse.value.body.trim()
   if (!t) return null
   try {
      return JSON.parse(t) as unknown
   } catch {
      return null
   }
})

watch(tryResponse, (v) => {
   if (v) tryResponseJsonExplorer.value = true
})

function openTryModal() {
   tryVisible.value = true
}

function onTryShow() {
   tryError.value = ''
   tryResponse.value = null
   tryApiKeyReveal.value = false
   hydrateTryFormFromSession()
}

function substituteAuthPlaceholders(raw: string, key: string): string {
   if (!key) return raw
   const k = key.trim()
   if (raw.includes('Bearer')) return `Bearer ${k}`
   if (raw.includes('<token>')) return raw.replace(/<token>/g, k)
   if (raw.includes('<credentials>')) return raw.replace(/<credentials>/g, k)
   if (raw.includes('<apiKey>')) return raw.replace(/<apiKey>/g, k)
   return raw
}

async function sendTryRequest() {
   if (props.webhook) return
   let body: string | undefined
   if (methodAcceptsBody.value && showTryRequestBody.value) {
      try {
         JSON.parse(tryBodyJson.value || '{}')
         body = tryBodyJson.value
      } catch {
         toast.add({ severity: 'error', summary: 'JSON invalide', detail: 'Le corps de la requête n’est pas du JSON valide.', life: 3500 })
         return
      }
   }

   trySending.value = true
   tryError.value = ''
   tryResponse.value = null
   const key = tryApiKey.value.trim()

   try {
      const headers: Record<string, string> = {}
      for (const [name, value] of Object.entries(activeSecurity.value?.headers || {})) {
         headers[name] = key ? substituteAuthPlaceholders(String(value), key) : String(value)
      }
      if (key && !headers.Authorization) headers.Authorization = `Bearer ${key}`

      const u = new URL(tryDialogFullUrl.value)
      for (const [name, value] of Object.entries(activeSecurity.value?.query || {})) {
         let v = String(value)
         if (key) v = substituteAuthPlaceholders(v, key)
         u.searchParams.set(name, v)
      }
      for (const parameter of props.parameters) {
         if (parameter.in !== 'query' || !parameter.required) continue
         const raw = parameter.example !== undefined ? String(parameter.example) : `{${parameter.name}}`
         u.searchParams.set(parameter.name, raw.startsWith('{') ? raw : encodeURIComponent(raw))
      }

      if (methodAcceptsBody.value && body) headers['Content-Type'] = headers['Content-Type'] || 'application/json'

      const requestUrl = u.toString()
      const methodUpper = props.method.toUpperCase()

      let res: Response
      if (import.meta.env.DEV) {
         res = await fetch('/__try-proxy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
               url: requestUrl,
               method: methodUpper,
               headers,
               body: methodAcceptsBody.value && body ? body : undefined
            })
         })
      } else {
         const init: RequestInit = {
            method: methodUpper,
            headers
         }
         if (methodAcceptsBody.value && body) init.body = body
         res = await fetch(requestUrl, init)
      }
      const text = await res.text()
      tryResponse.value = { ok: res.ok, status: res.status, statusText: res.statusText, body: text }
   } catch (e: unknown) {
      tryError.value = e instanceof Error ? e.message : String(e)
   } finally {
      trySending.value = false
   }
}

watch(tryApiKey, (value) => writeTryApiKeyToSession(value))
watch(trySplitLayout, (value) => writeTrySplitLayoutToSession(value))

watch(
   () => props.environmentValues,
   (values) => {
      store.sampleEnvironment = coalesceEnvironmentChoice(values, store.sampleEnvironment)
      tryDialogEnvironment.value = coalesceEnvironmentChoice(values, tryDialogEnvironment.value)
   },
   { immediate: true }
)

watch([tryPathParamValues, tryBodyJson, tryDialogEnvironment, showTryRequestBody], () => persistTryRouteState(), { deep: true })
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

watch(
   tryStateKey,
   (next, prev) => {
      if (prev !== undefined && prev !== next && lastHydratedTryStateKey === prev) {
         persistTryRouteStateForKey(prev, tryPathParamValues.value, tryBodyJson.value, tryDialogEnvironment.value, showTryRequestBody.value)
      }
      hydrateTryFormFromSession()
   },
   { flush: 'sync', immediate: true }
)

onBeforeUnmount(() => {
   if (lastHydratedTryStateKey === tryStateKey.value) persistTryRouteState()
})

watch(
   () => props.servers.length,
   (len) => {
      if (serverIndex.value >= len) serverIndex.value = 0
   }
)

const serverChoices = computed(() => props.servers.map((server, index) => ({ label: serverUrlForEnvironment(server, store.sampleEnvironment), value: index })))
const securityChoices = computed(() => props.security.map((option, index) => ({ label: option.label, value: index })))
const activeServer = computed(() => props.servers[serverIndex.value] || props.servers[0])
const activeSecurity = computed(() => props.security[securityIndex.value] || props.security[0])
const activeResponse = computed(() => props.responses.find((response) => response.status === responseStatus.value))

const tryDialogFullUrl = computed(() => {
   const path = buildPathWithParamValues(props.route, tryPathParamValues.value)
   if (props.webhook) return path
   const env = tryDialogEnvironment.value || store.sampleEnvironment
   return joinUrl(activeServer.value ? serverUrlForEnvironment(activeServer.value, env) : '', path)
})

const fullUrl = computed(() => {
   const path = applyPathParams(props.route, props.parameters)
   if (props.webhook) return path
   return joinUrl(activeServer.value ? serverUrlForEnvironment(activeServer.value, store.sampleEnvironment) : '', path)
})

const curl = computed(() => {
   const query: Record<string, string> = { ...(activeSecurity.value?.query || {}) }
   for (const parameter of props.parameters) {
      if (parameter.in !== 'query' || !parameter.required) continue
      const raw = parameter.example !== undefined ? String(parameter.example) : `{${parameter.name}}`
      query[parameter.name] = raw
   }
   return buildCurl({
      method: props.method,
      url: fullUrl.value,
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
