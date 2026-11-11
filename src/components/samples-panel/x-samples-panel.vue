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
               aria-label="API Playground (beta)"
               @click="openTryModal"
            >
               <span class="samples-try-label">API Playground</span>
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
               <span class="try-dialog-icon-wrap" aria-hidden="true">
                  <i class="pi pi-bolt" />
               </span>
               <span class="try-dialog-title">API Playground</span>
               <span class="beta-badge try-dialog-beta" aria-label="Beta">beta</span>

               <div class="try-dialog-header-tools">
                  <template v-if="!webhook && environments.length">
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

                  <button
                     type="button"
                     class="try-split-layout-toggle"
                     :class="{ active: trySplitLayout }"
                     :aria-pressed="trySplitLayout"
                     :aria-label="trySplitLayout ? 'Passer à la disposition empilée' : 'Passer à la disposition côte à côte'"
                     v-tooltip.bottom="trySplitLayout ? 'Vue côte à côte active (cliquer pour empiler)' : 'Activer la vue côte à côte (2 panneaux)'"
                     @click="trySplitLayout = !trySplitLayout"
                  >
                     <svg
                        class="try-split-icon"
                        viewBox="0 0 18 18"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.65"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        aria-hidden="true"
                     >
                        <rect x="2" y="2.5" width="14" height="13" rx="2.5" />
                        <line v-if="trySplitLayout" x1="9" y1="2.5" x2="9" y2="15.5" />
                        <line v-else x1="2" y1="9" x2="16" y2="9" />
                     </svg>
                  </button>
               </div>
            </div>
         </div>
      </template>

      <div class="try-dialog-shell">
         <!-- Top Omnibox Bar: Method + Live URL + Send Button -->
         <div v-if="!webhook && servers.length" class="try-omnibox">
            <div class="try-omnibox-url">
               <span class="method try-dialog-method" :class="'m-' + method">{{ method }}</span>
               <code class="try-dialog-url-preview" :title="tryDialogFullUrl">{{ tryDialogFullUrl }}</code>
               <Button
                  class="copy-btn try-url-copy"
                  icon="pi pi-copy"
                  size="small"
                  text
                  rounded
                  aria-label="Copier l'URL complète"
                  @click="copy(tryDialogFullUrl, 'URL complète copiée')"
               />
            </div>
            <Button
               label="Send Request"
               icon="pi pi-send"
               class="try-send-btn"
               :loading="trySending"
               :disabled="trySendDisabled"
               :title="!isAllowedTargetUrl(tryDialogFullUrl) ? 'Seuls les serveurs ezmax.com sont autorisés' : undefined"
               @click="sendTryRequest"
            />
         </div>

         <div v-if="!isAllowedTargetUrl(tryDialogFullUrl)" class="try-warning-banner">
            <i class="pi pi-exclamation-triangle" aria-hidden="true" />
            <span>Seules les requêtes destinées aux serveurs de domaine <code>ezmax.com</code> sont autorisées.</span>
         </div>

         <div class="try-dialog-body" :class="{ 'try-dialog-body--split': trySplitLayout }">
            <!-- Request Configuration Column -->
            <div class="try-dialog-request">
               <!-- Auth Card -->
               <section class="try-card">
                  <div class="try-card-head">
                     <span class="try-card-title">
                        <i class="pi pi-key" aria-hidden="true" />
                        Authentication
                     </span>
                     <span v-if="activeSecurity" class="auth-chip try-auth-chip">
                        <i class="pi pi-lock" aria-hidden="true" />
                        {{ activeSecurity.label }}
                     </span>
                     <span class="try-key-status" :class="{ active: Boolean(tryApiKey.trim()) }">
                        <span class="try-key-dot" />
                        {{ tryApiKey.trim() ? 'Token configuré' : 'Aucun token' }}
                     </span>
                  </div>
                  <div class="try-card-content">
                     <div v-if="security.length > 1" class="try-security-select-row">
                        <Select v-model="securityIndex" :options="securityChoices" option-label="label" option-value="value" size="small" class="samples-select" />
                     </div>
                     <div class="try-api-key-row">
                        <IconField class="try-api-key-field">
                           <InputIcon class="pi pi-shield" />
                           <InputText
                              id="try-api-key"
                              v-model="tryApiKey"
                              fluid
                              class="try-api-key"
                              :class="{ 'try-api-key--masked': !tryApiKeyReveal }"
                              placeholder="Coller votre clé API (Authorization) ou jeton Bearer…"
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
                        </IconField>
                        <Button
                           type="button"
                           :icon="tryApiKeyReveal ? 'pi pi-eye-slash' : 'pi pi-eye'"
                           severity="secondary"
                           text
                           rounded
                           class="try-api-key-reveal"
                           :aria-label="tryApiKeyReveal ? 'Masquer la clé' : 'Afficher la clé'"
                           :aria-pressed="tryApiKeyReveal"
                           v-tooltip.top="tryApiKeyReveal ? 'Masquer' : 'Afficher'"
                           @click="tryApiKeyReveal = !tryApiKeyReveal"
                        />
                        <Button
                           v-if="tryApiKey"
                           type="button"
                           icon="pi pi-times"
                           severity="secondary"
                           text
                           rounded
                           class="try-api-key-reveal"
                           aria-label="Effacer la clé"
                           v-tooltip.top="'Effacer'"
                           @click="tryApiKey = ''"
                        />
                     </div>
                  </div>
               </section>

               <!-- Path & Query Parameters Card -->
               <section v-if="!webhook && (pathParamNames.length || queryParamsList.length || headerParamsList.length)" class="try-card">
                  <div class="try-card-head">
                     <span class="try-card-title">
                        <i class="pi pi-sliders-h" aria-hidden="true" />
                        Parameters
                     </span>
                     <div class="try-param-tabs" role="tablist">
                        <button
                           v-if="pathParamNames.length"
                           type="button"
                           role="tab"
                           class="try-param-tab"
                           :class="{ active: activeParamTab === 'path' }"
                           @click="activeParamTab = 'path'"
                        >
                           Path
                           <span class="try-tab-badge">{{ pathParamNames.length }}</span>
                        </button>
                        <button
                           v-if="queryParamsList.length"
                           type="button"
                           role="tab"
                           class="try-param-tab"
                           :class="{ active: activeParamTab === 'query' }"
                           @click="activeParamTab = 'query'"
                        >
                           Query
                           <span class="try-tab-badge">{{ queryParamsList.length }}</span>
                        </button>
                        <button
                           v-if="headerParamsList.length"
                           type="button"
                           role="tab"
                           class="try-param-tab"
                           :class="{ active: activeParamTab === 'header' }"
                           @click="activeParamTab = 'header'"
                        >
                           Headers
                           <span class="try-tab-badge">{{ headerParamsList.length }}</span>
                        </button>
                     </div>
                     <Button
                        type="button"
                        icon="pi pi-refresh"
                        label="Reset"
                        size="small"
                        severity="secondary"
                        text
                        class="try-card-action-btn"
                        @click="resetTryParams"
                     />
                  </div>

                  <!-- Path Params Table -->
                  <div v-show="activeParamTab === 'path' && pathParamNames.length" class="try-params-table">
                     <div v-for="param in pathParamsMeta" :key="param.name" class="try-param-grid-row">
                        <div class="try-param-meta">
                           <label class="try-param-name" :for="'try-path-' + param.name">
                              {{ param.name }}
                              <span class="required-mark" title="Required">*</span>
                           </label>
                           <span v-if="param.type" class="chip-type" :class="'is-' + param.type">{{ param.type }}</span>
                        </div>
                        <div class="try-param-control">
                           <Select
                              v-if="param.enumValues.length"
                              :id="'try-path-' + param.name"
                              v-model="tryPathParamValues[param.name]"
                              :options="param.enumValues"
                              size="small"
                              editable
                              fluid
                              :placeholder="'{' + param.name + '}'"
                           />
                           <InputText
                              v-else
                              :id="'try-path-' + param.name"
                              v-model="tryPathParamValues[param.name]"
                              fluid
                              class="try-param-input"
                              :placeholder="param.placeholder"
                              autocomplete="off"
                           />
                           <p v-if="param.description" class="try-param-desc">{{ param.description }}</p>
                        </div>
                     </div>
                  </div>

                  <!-- Query Params Table -->
                  <div v-show="activeParamTab === 'query' && queryParamsList.length" class="try-params-table">
                     <div v-for="param in queryParamsList" :key="param.name" class="try-param-grid-row">
                        <div class="try-param-meta">
                           <label class="try-param-name" :for="'try-query-' + param.name">
                              {{ param.name }}
                              <span v-if="param.required" class="required-mark" title="Required">*</span>
                           </label>
                           <span v-if="param.type" class="chip-type" :class="'is-' + param.type">{{ param.type }}</span>
                        </div>
                        <div class="try-param-control">
                           <Select
                              v-if="param.enumValues.length"
                              :id="'try-query-' + param.name"
                              v-model="tryQueryParamValues[param.name]"
                              :options="param.enumValues"
                              size="small"
                              editable
                              show-clear
                              fluid
                              :placeholder="param.placeholder"
                           />
                           <InputText
                              v-else
                              :id="'try-query-' + param.name"
                              v-model="tryQueryParamValues[param.name]"
                              fluid
                              class="try-param-input"
                              :placeholder="param.placeholder"
                              autocomplete="off"
                           />
                           <p v-if="param.description" class="try-param-desc">{{ param.description }}</p>
                        </div>
                     </div>
                  </div>

                  <!-- Header Params Table -->
                  <div v-show="activeParamTab === 'header' && headerParamsList.length" class="try-params-table">
                     <div v-for="param in headerParamsList" :key="param.name" class="try-param-grid-row">
                        <div class="try-param-meta">
                           <label class="try-param-name" :for="'try-header-' + param.name">
                              {{ param.name }}
                              <span v-if="param.required" class="required-mark" title="Required">*</span>
                           </label>
                           <span v-if="param.type" class="chip-type" :class="'is-' + param.type">{{ param.type }}</span>
                        </div>
                        <div class="try-param-control">
                           <Select
                              v-if="param.enumValues.length"
                              :id="'try-header-' + param.name"
                              v-model="tryHeaderParamValues[param.name]"
                              :options="param.enumValues"
                              size="small"
                              editable
                              show-clear
                              fluid
                              :placeholder="param.placeholder"
                           />
                           <InputText
                              v-else
                              :id="'try-header-' + param.name"
                              v-model="tryHeaderParamValues[param.name]"
                              fluid
                              class="try-param-input"
                              :placeholder="param.placeholder"
                              autocomplete="off"
                           />
                           <p v-if="param.description" class="try-param-desc">{{ param.description }}</p>
                        </div>
                     </div>
                  </div>
               </section>

               <!-- JSON Body Editor Card -->
               <section v-if="showTryRequestBody" class="try-card try-card--body">
                  <div class="try-card-head">
                     <span class="try-card-title">
                        <i class="pi pi-code" aria-hidden="true" />
                        Request Body
                        <span class="try-content-type-pill">application/json</span>
                     </span>
                     <span class="try-json-validity" :class="isTryBodyValidJson ? 'valid' : 'invalid'">
                        <i class="pi" :class="isTryBodyValidJson ? 'pi-check-circle' : 'pi-exclamation-triangle'" aria-hidden="true" />
                        {{ isTryBodyValidJson ? 'JSON valide' : 'JSON invalide' }}
                     </span>
                     <div class="try-body-toolbar">
                        <Button
                           type="button"
                           icon="pi pi-align-left"
                           label="Format"
                           size="small"
                           severity="secondary"
                           text
                           class="try-card-action-btn"
                           :disabled="!isTryBodyValidJson"
                           @click="formatTryBodyJson"
                        />
                        <Button
                           type="button"
                           icon="pi pi-history"
                           label="Reset"
                           size="small"
                           severity="secondary"
                           text
                           class="try-card-action-btn"
                           @click="resetTryBodyJson"
                        />
                     </div>
                  </div>
                  <div class="try-editor-wrap" :class="{ 'has-error': !isTryBodyValidJson }">
                     <div class="try-code-editor">
                        <pre ref="tryBodyPre" class="try-body-highlight" aria-hidden="true"><code class="hljs language-json" v-html="highlightedTryBody"></code></pre>
                        <textarea
                           ref="tryBodyTextarea"
                           id="try-body-json"
                           v-model="tryBodyJson"
                           class="try-body-textarea"
                           spellcheck="false"
                           rows="12"
                           placeholder="{}"
                           @scroll="onTryBodyScroll"
                           @keydown.ctrl.enter.prevent="sendTryRequest"
                           @keydown.meta.enter.prevent="sendTryRequest"
                        />
                     </div>
                  </div>
               </section>
            </div>

            <!-- Response Inspector Column -->
            <div
               v-show="trySplitLayout || tryError || tryResponse || trySending"
               class="try-dialog-response-column"
               :class="{ 'try-dialog-response-column--split': trySplitLayout }"
            >
               <div v-if="trySending" class="try-response try-response-empty" role="status" aria-live="polite">
                  <div class="try-response-label">Response</div>
                  <div class="try-response-placeholder">
                     <i class="pi pi-spin pi-spinner try-placeholder-icon" />
                     <p class="try-response-empty-hint">Exécution de la requête en cours…</p>
                  </div>
               </div>

               <div v-else-if="tryError" class="try-response try-response-error" role="alert">
                  <div class="try-response-meta">
                     <span class="try-status-pill err">
                        <i class="pi pi-times-circle" />
                        Network / Request Error
                     </span>
                  </div>
                  <pre class="try-response-pre">{{ tryError }}</pre>
               </div>

               <div v-else-if="tryResponse" class="try-response" :class="{ 'try-response-ok': tryResponse.ok }">
                  <div class="try-response-meta">
                     <div class="try-response-badges">
                        <span class="try-status-pill" :class="tryResponse.ok ? 'ok' : 'err'">
                           <span class="try-status-dot" />
                           {{ tryResponse.status }} {{ tryResponse.statusText }}
                        </span>
                        <span v-if="tryResponse.durationMs !== undefined" class="try-metric-chip" title="Temps de réponse">
                           <i class="pi pi-clock" />
                           {{ tryResponse.durationMs }} ms
                        </span>
                        <span v-if="tryResponseSizeLabel" class="try-metric-chip" title="Taille de la charge">
                           <i class="pi pi-database" />
                           {{ tryResponseSizeLabel }}
                        </span>
                     </div>

                     <div class="try-response-meta-actions">
                        <div class="try-view-pills" role="tablist">
                           <button
                              v-if="tryResponseParsedJson !== null"
                              type="button"
                              role="tab"
                              class="try-view-pill"
                              :class="{ active: tryResponseTab === 'tree' }"
                              @click="tryResponseTab = 'tree'"
                           >
                              Explorer
                           </button>
                           <button
                              type="button"
                              role="tab"
                              class="try-view-pill"
                              :class="{ active: tryResponseTab === 'raw' }"
                              @click="tryResponseTab = 'raw'"
                           >
                              Raw
                           </button>
                           <button
                              v-if="Object.keys(tryResponse.headers || {}).length"
                              type="button"
                              role="tab"
                              class="try-view-pill"
                              :class="{ active: tryResponseTab === 'headers' }"
                              @click="tryResponseTab = 'headers'"
                           >
                              Headers ({{ Object.keys(tryResponse.headers || {}).length }})
                           </button>
                        </div>
                        <Button
                           class="copy-btn"
                           icon="pi pi-copy"
                           size="small"
                           text
                           rounded
                           aria-label="Copy response"
                           @click="copy(tryResponseBodyFormatted, 'Réponse copiée')"
                        />
                     </div>
                  </div>

                  <div v-if="tryResponseTab === 'headers'" class="try-response-headers">
                     <div v-for="(val, key) in tryResponse.headers" :key="key" class="try-header-row">
                        <code class="try-header-key">{{ key }}</code>
                        <code class="try-header-val">{{ val }}</code>
                     </div>
                  </div>

                  <div v-else-if="tryResponseParsedJson !== null" class="json-explorer try-response-json-explorer" role="region" aria-label="Response body">
                     <XJsonNode v-if="tryResponseTab === 'tree'" :value="tryResponseParsedJson" :depth="0" />
                     <pre v-else class="try-response-pre try-response-pre--raw"><code class="hljs language-json" v-html="highlighted(tryResponseBodyFormatted, 'json')"></code></pre>
                  </div>
                  <pre v-else class="try-response-pre">{{ tryResponseBodyFormatted }}</pre>
               </div>

               <div v-else-if="trySplitLayout" class="try-response try-response-empty" role="status" aria-live="polite">
                  <div class="try-response-label">Response Inspector</div>
                  <div class="try-response-placeholder">
                     <i class="pi pi-send try-placeholder-icon" />
                     <p class="try-response-empty-title">Prêt à envoyer</p>
                     <p class="try-response-empty-hint">Configurez votre clé API et vos paramètres à gauche, puis cliquez sur <strong>Send Request</strong> pour inspecter la réponse en direct.</p>
                  </div>
               </div>
            </div>
         </div>
      </div>
   </Dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import hljs from 'highlight.js/lib/core'
import bash from 'highlight.js/lib/languages/bash'
import json from 'highlight.js/lib/languages/json'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import { useToast } from 'primevue/usetoast'
import XJsonNode from 'src/components/samples-panel/x-json-node.vue'
import { useGlobalStore } from 'src/stores/global'
import { useOpenApi } from 'src/composables/use-openapi'
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
   if (typeof sessionStorage === 'undefined') return true
   try {
      const val = sessionStorage.getItem(TRY_SPLIT_LAYOUT_SESSION_KEY)
      return val === null ? true : val === '1'
   } catch {
      return true
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
   queryParams?: Record<string, string>
   headerParams?: Record<string, string>
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
const { uploadedName } = useOpenApi()
const isUploadedSpec = computed(() => Boolean(uploadedName?.value))
const environments = computed(() => props.environmentValues)

const tryVisible = ref(false)
const tryBodyJson = ref('{}')
const tryApiKey = ref(readTryApiKeyFromSession())
/** Side-by-side request / response layout (sessionStorage, default true for developer console feel) */
const trySplitLayout = ref(readTrySplitLayoutFromSession())
const tryDialogWidth = computed(() => (trySplitLayout.value ? 'min(1440px, 98vw)' : 'min(1080px, 96vw)'))
const tryDialogContentStyle = computed(() =>
   trySplitLayout.value
      ? { height: 'min(88vh, 900px)', maxHeight: 'min(88vh, 900px)', overflow: 'hidden', padding: '0', display: 'flex', flexDirection: 'column', minHeight: '0' }
      : { height: 'min(86vh, 880px)', maxHeight: 'min(86vh, 880px)', overflow: 'auto', padding: '0' }
)
/** When false, API key is masked with CSS (not type=password) to avoid browser save-password prompts */
const tryApiKeyReveal = ref(false)
const trySending = ref(false)
const tryError = ref('')
const tryResponse = ref<{
   ok: boolean
   status: number
   statusText: string
   body: string
   durationMs?: number
   headers?: Record<string, string>
} | null>(null)
const tryResponseTab = ref<'tree' | 'raw' | 'headers'>('tree')
const activeParamTab = ref<'path' | 'query' | 'header'>('path')

const methodAcceptsBody = computed(() => {
   const m = props.method.toLowerCase()
   return ['post', 'put', 'patch', 'delete'].includes(m)
})

const showTryRequestBody = computed(() => props.requestExample !== undefined)

const isTryBodyValidJson = computed(() => {
   if (!showTryRequestBody.value) return true
   const raw = tryBodyJson.value.trim()
   if (!raw) return false
   try {
      JSON.parse(raw)
      return true
   } catch {
      return false
   }
})

const tryBodyPre = ref<HTMLElement | null>(null)
const tryBodyTextarea = ref<HTMLTextAreaElement | null>(null)

function onTryBodyScroll() {
   if (tryBodyPre.value && tryBodyTextarea.value) {
      tryBodyPre.value.scrollTop = tryBodyTextarea.value.scrollTop
      tryBodyPre.value.scrollLeft = tryBodyTextarea.value.scrollLeft
   }
}

const highlightedTryBody = computed(() => {
   const val = tryBodyJson.value || ''
   if (!val) return ''
   const toHighlight = val.endsWith('\n') ? val + ' ' : val
   return highlighted(toHighlight, 'json')
})

function formatTryBodyJson() {
   try {
      const parsed = JSON.parse(tryBodyJson.value)
      tryBodyJson.value = JSON.stringify(parsed, null, 2)
      nextTick(() => onTryBodyScroll())
   } catch {
      /* ignore invalid JSON */
   }
}

function resetTryBodyJson() {
   if (props.requestExample !== undefined) {
      tryBodyJson.value = prettyJson(props.requestExample)
   } else {
      tryBodyJson.value = '{\n  \n}'
   }
   nextTick(() => onTryBodyScroll())
}

const pathParamNames = computed(() => (props.webhook ? [] : pathTemplateParamNames(props.route)))

interface ParamFieldMeta {
   name: string
   required: boolean
   type: string
   description: string
   placeholder: string
   enumValues: string[]
}

function buildParamMeta(name: string, p?: FlatParameter, fallbackRequired = false): ParamFieldMeta {
   const schema = p?.schema || {}
   const rawType = Array.isArray(schema.type) ? schema.type.find((t: string) => t !== 'null') : schema.type
   const type = String(rawType || (schema.$schemaName ? 'object' : 'string'))
   const enums = Array.isArray(schema.enum) ? schema.enum.map((v: unknown) => String(v)) : []
   const ex = p?.example !== undefined ? String(p.example) : schema.example !== undefined ? String(schema.example) : ''
   return {
      name,
      required: Boolean(p?.required ?? fallbackRequired),
      type,
      description: p?.description || schema.description || '',
      placeholder: ex || `{${name}}`,
      enumValues: enums
   }
}

const pathParamsMeta = computed<ParamFieldMeta[]>(() =>
   pathParamNames.value.map((name) => {
      const p = props.parameters.find((x) => x.in === 'path' && x.name === name)
      return buildParamMeta(name, p, true)
   })
)

const queryParamsList = computed<ParamFieldMeta[]>(() =>
   props.parameters
      .filter((p) => p.in === 'query')
      .map((p) => buildParamMeta(p.name, p, false))
)

const headerParamsList = computed<ParamFieldMeta[]>(() =>
   props.parameters
      .filter((p) => p.in === 'header')
      .map((p) => buildParamMeta(p.name, p, false))
)

const tryPathParamValues = ref<Record<string, string>>({})
const tryQueryParamValues = ref<Record<string, string>>({})
const tryHeaderParamValues = ref<Record<string, string>>({})
/** Environment for Try modal only (per-route persistence in sessionStorage) */
const tryDialogEnvironment = ref('')

const tryStateKey = computed(() => `${props.method.toUpperCase()}:${props.route}`)

function defaultQueryParamValues(parameters: FlatParameter[]): Record<string, string> {
   const out: Record<string, string> = {}
   for (const p of parameters) {
      if (p.in !== 'query') continue
      out[p.name] = p.example !== undefined && p.required ? String(p.example) : ''
   }
   return out
}

function defaultHeaderParamValues(parameters: FlatParameter[]): Record<string, string> {
   const out: Record<string, string> = {}
   for (const p of parameters) {
      if (p.in !== 'header') continue
      out[p.name] = p.example !== undefined && p.required ? String(p.example) : ''
   }
   return out
}

function resetTryParams() {
   tryPathParamValues.value = defaultPathParamValues(props.route, props.parameters)
   tryQueryParamValues.value = defaultQueryParamValues(props.parameters)
   tryHeaderParamValues.value = defaultHeaderParamValues(props.parameters)
}

function persistTryRouteStateForKey(
   stateKey: string,
   pathParams: Record<string, string>,
   queryParams: Record<string, string>,
   headerParams: Record<string, string>,
   bodyJson: string,
   environment: string,
   hasRequestBody: boolean
) {
   if (props.webhook) return
   const all = readAllTryRouteStates()
   const entry: TryRoutePersisted = {
      pathParams: { ...pathParams },
      queryParams: { ...queryParams },
      headerParams: { ...headerParams },
      environment
   }
   if (hasRequestBody) entry.bodyJson = bodyJson
   all[stateKey] = entry
   writeTryRouteStates(all)
}

function persistTryRouteState() {
   persistTryRouteStateForKey(
      tryStateKey.value,
      tryPathParamValues.value,
      tryQueryParamValues.value,
      tryHeaderParamValues.value,
      tryBodyJson.value,
      tryDialogEnvironment.value,
      showTryRequestBody.value
   )
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

   const defaultQuery = defaultQueryParamValues(props.parameters)
   const mergedQuery: Record<string, string> = { ...defaultQuery }
   if (saved?.queryParams) {
      for (const [k, v] of Object.entries(saved.queryParams)) {
         if (v !== undefined) mergedQuery[k] = v
      }
   }
   tryQueryParamValues.value = mergedQuery

   const defaultHeaders = defaultHeaderParamValues(props.parameters)
   const mergedHeaders: Record<string, string> = { ...defaultHeaders }
   if (saved?.headerParams) {
      for (const [k, v] of Object.entries(saved.headerParams)) {
         if (v !== undefined) mergedHeaders[k] = v
      }
   }
   tryHeaderParamValues.value = mergedHeaders

   if (pathParamNames.value.length) activeParamTab.value = 'path'
   else if (queryParamsList.value.length) activeParamTab.value = 'query'
   else if (headerParamsList.value.length) activeParamTab.value = 'header'

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

function isAllowedTargetUrl(rawUrl: string): boolean {
   try {
      const parsed = new URL(rawUrl)
      const host = parsed.hostname.toLowerCase()
      return host === 'ezmax.com' || host.endsWith('.ezmax.com')
   } catch {
      return false
   }
}

const isTargetAllowed = computed(() => isAllowedTargetUrl(tryDialogFullUrl.value))
const trySendDisabled = computed(() => trySending.value || props.webhook || !props.servers.length || !isTargetAllowed.value)

const tryResponseBodyFormatted = computed(() => {
   if (!tryResponse.value?.body) return ''
   const t = tryResponse.value.body.trim()
   try {
      return JSON.stringify(JSON.parse(t), null, 2)
   } catch {
      return tryResponse.value.body
   }
})

const tryResponseSizeLabel = computed(() => {
   if (!tryResponse.value?.body) return ''
   const bytes = new Blob([tryResponse.value.body]).size
   if (bytes < 1024) return `${bytes} B`
   return `${(bytes / 1024).toFixed(1)} KB`
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
   if (v) {
      tryResponseTab.value = tryResponseParsedJson.value !== null ? 'tree' : 'raw'
   }
})

function openTryModal() {
   tryVisible.value = true
}

function onTryShow() {
   tryError.value = ''
   tryResponse.value = null
   tryApiKeyReveal.value = false
   hydrateTryFormFromSession()
   nextTick(() => onTryBodyScroll())
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
   if (!isAllowedTargetUrl(tryDialogFullUrl.value)) {
      toast.add({
         severity: 'warn',
         summary: 'Domaine non autorisé',
         detail: 'Seules les API hébergées sur ezmax.com (*.ezmax.com) sont autorisées.',
         life: 4000
      })
      return
   }
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
   const startedAt = performance.now()

   try {
      const headers: Record<string, string> = {}
      for (const [name, value] of Object.entries(activeSecurity.value?.headers || {})) {
         headers[name] = key ? substituteAuthPlaceholders(String(value), key) : String(value)
      }
      if (key && !headers.Authorization) headers.Authorization = `Bearer ${key}`

      for (const [hName, hVal] of Object.entries(tryHeaderParamValues.value)) {
         const trimmed = hVal?.trim()
         if (trimmed) headers[hName] = trimmed
      }

      const u = new URL(tryDialogFullUrl.value)
      for (const [name, value] of Object.entries(activeSecurity.value?.query || {})) {
         let v = String(value)
         if (key) v = substituteAuthPlaceholders(v, key)
         u.searchParams.set(name, v)
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
      const durationMs = Math.round(performance.now() - startedAt)
      const resHeaders: Record<string, string> = {}
      res.headers.forEach((val, k) => {
         resHeaders[k] = val
      })
      tryResponse.value = { ok: res.ok, status: res.status, statusText: res.statusText, body: text, durationMs, headers: resHeaders }
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

watch([tryPathParamValues, tryQueryParamValues, tryHeaderParamValues, tryBodyJson, tryDialogEnvironment, showTryRequestBody], () => persistTryRouteState(), { deep: true })
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
         persistTryRouteStateForKey(
            prev,
            tryPathParamValues.value,
            tryQueryParamValues.value,
            tryHeaderParamValues.value,
            tryBodyJson.value,
            tryDialogEnvironment.value,
            showTryRequestBody.value
         )
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
   const base = joinUrl(activeServer.value ? serverUrlForEnvironment(activeServer.value, env) : '', path)
   const queryEntries = Object.entries(tryQueryParamValues.value).filter(([, v]) => v !== undefined && v.trim() !== '')
   if (!queryEntries.length) return base
   const qs = queryEntries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v.trim())}`).join('&')
   return `${base}${base.includes('?') ? '&' : '?'}${qs}`
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
