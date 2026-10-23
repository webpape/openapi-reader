<template>
   <div class="shell">
      <header class="topbar">
         <Button class="menu-btn" icon="pi pi-bars" text rounded aria-label="Open navigation" @click="navOpen = true" />
         <div class="brand">
            <img v-if="logoUrl" class="logo" :src="logoUrl" :alt="logoAlt" />
            <h1 :title="title">{{ title }}</h1>
            <span v-if="version" class="version">v{{ version }}</span>
         </div>

         <Select v-model="specId" :options="groupedSpecs" option-label="label" option-value="id" option-group-label="label" option-group-children="items" option-disabled="disabled" filter filter-placeholder="Search specs" placeholder="Spec" size="small" class="spec-select" overlay-class="spec-overlay" :disabled="loading && !documentModel">
            <template #value="{ value }">
               <span class="spec-value">{{ specFileName(value) }}</span>
            </template>
         </Select>

         <div class="top-actions">
            <Button icon="pi pi-download" text rounded aria-label="Download specification" v-tooltip.bottom="'Download JSON'" :disabled="!rawText" @click="downloadSpec" />
            <Button icon="pi pi-github" text rounded aria-label="Open specifications on GitHub" v-tooltip.bottom="'Specs eZmax'" as="a" :href="specsPage" target="_blank" rel="noreferrer" />
            <Button :icon="store.darkMode ? 'pi pi-sun' : 'pi pi-moon'" text rounded :aria-label="store.darkMode ? 'Light mode' : 'Dark mode'" v-tooltip.bottom="store.darkMode ? 'Light mode' : 'Dark mode'" @click="store.darkMode = !store.darkMode" />
            <Button icon="pi pi-cog" text rounded aria-label="Settings" v-tooltip.bottom="'Settings'" @click="openSettings" />
            <Popover ref="settingsPopover">
               <div class="settings">
                  <p class="settings-title">Text size</p>
                  <div class="size-picker" role="group" aria-label="Text size">
                     <button v-for="size in textSizes" :key="size.value" type="button" :class="{ active: store.textSize === size.value }" :aria-pressed="store.textSize === size.value" :title="size.name" @click="store.textSize = size.value">{{ size.label }}</button>
                  </div>
                  <p class="settings-title">Display</p>
                  <label><ToggleSwitch v-model="store.showDescription" /> Descriptions</label>
                  <label><ToggleSwitch v-model="store.showObjectNames" /> Object names</label>
                  <label><ToggleSwitch v-model="store.showDeprecated" /> Deprecated operations</label>
                  <label><ToggleSwitch v-model="store.showProperties" /> Expand advanced properties</label>
               </div>
            </Popover>
         </div>
      </header>

      <div v-if="navOpen" class="backdrop" @click="navOpen = false"></div>

      <div class="body">
         <aside class="sidebar" :class="{ open: navOpen }" :style="{ width: sidebarWidth + 'px' }">
            <div class="search-control" :class="{ open: store.searchOptionsOpen }">
               <div class="sidebar-search">
                  <IconField class="search-field">
                     <InputIcon class="pi pi-search" />
                     <InputText v-model="theSearch" :placeholder="searchPlaceholder" size="small" fluid />
                     <button v-if="theSearch" type="button" class="search-clear" aria-label="Clear search" @click="theSearch = ''">
                        <i class="pi pi-times"></i>
                     </button>
                  </IconField>
                  <button type="button" class="search-advanced" :class="{ active: store.searchOptionsOpen || store.searchInDescription }" :aria-expanded="store.searchOptionsOpen" title="Search options" @click="store.searchOptionsOpen = !store.searchOptionsOpen">
                     <i class="pi pi-sliders-h"></i>
                  </button>
               </div>
               <div v-show="store.searchOptionsOpen" class="search-options">
                  <label><ToggleSwitch v-model="store.searchInName" /> Route name</label>
                  <label><ToggleSwitch v-model="store.searchInDescription" /> Descriptions</label>
               </div>
            </div>
            <div class="sidebar-scroll">
               <section v-for="group in visibleGroups" :key="group.name" class="nav-group">
                  <h2><span>{{ group.name }}</span><span class="nav-count">{{ group.tags.length }}</span></h2>
                  <div v-for="tag in group.tags" :id="'tag-' + tag" :key="tag" class="tag-block">
                     <button type="button" class="tag-head" :class="{ active: isActiveTag(tag) }" @click="onTag(tag)">
                        <span v-if="operationsFor(tag).length" class="caret" :class="{ open: isOpen(tag) }"></span>
                        <span v-else class="caret-spacer"></span>
                        <span class="tag-label">{{ formatTag(tag) }}</span>
                     </button>
                     <div v-show="isOpen(tag)" class="op-list">
                        <RouterLink v-for="operation in operationsFor(tag)" :key="operation.method + operation.operationId + operation.route" class="op" :class="{ 'router-link-active': isActiveOperation(tag, operation) }" :title="operation.route" :to="operation.operationId ? { name: 'page-details', params: { object: tag, operation: operation.operationId } } : { name: 'page-details', params: { object: tag } }" @click="navOpen = false">
                           <span class="method" :class="'m-' + operation.method">{{ operation.method }}</span>
                           <span class="op-label" :class="{ strike: operation.deprecated }">{{ operation.summary }}</span>
                        </RouterLink>
                     </div>
                  </div>
               </section>

               <section v-if="visibleWebhooks.length" class="nav-group">
                  <button type="button" class="nav-section" @click="store.webhooksOpen = !store.webhooksOpen">
                     <span class="caret" :class="{ open: webhooksExpanded }"></span>
                     <span>Webhooks</span>
                     <span class="nav-count">{{ visibleWebhooks.length }}</span>
                  </button>
                  <div v-show="webhooksExpanded" class="op-list">
                     <RouterLink v-for="webhook in visibleWebhooks" :key="webhook.name" class="op" :title="webhook.name" :to="{ name: 'webhook', params: { name: webhook.name } }" @click="navOpen = false">
                        <span class="method" :class="'m-' + webhook.method">{{ webhook.method }}</span>
                        <span class="op-label" :class="{ strike: webhook.deprecated }">{{ webhook.summary }}</span>
                     </RouterLink>
                  </div>
               </section>

               <section v-if="schemaCount" class="nav-group">
                  <button type="button" class="nav-section" @click="store.schemasOpen = !store.schemasOpen">
                     <span class="caret" :class="{ open: store.schemasOpen }"></span>
                     <span>Schemas</span>
                     <span class="nav-count">{{ schemaMatchCount }}</span>
                  </button>
                  <div v-show="store.schemasOpen" class="schema-list">
                     <button v-for="name in schemaMatches" :key="name" type="button" class="schema-hit" @click="openSchema(name)">{{ name }}</button>
                     <p v-if="schemaMatchCount > schemaMatches.length" class="sidebar-note">{{ schemaMatchCount - schemaMatches.length }} more. Refine the search.</p>
                  </div>
               </section>
               <p v-if="needle.length >= 2 && !visibleGroups.length && !visibleWebhooks.length" class="sidebar-note">No results</p>
            </div>
            <div class="resizer" @mousedown="startResize"></div>
         </aside>

         <main class="main">
            <div v-if="loading" class="state">
               <ProgressSpinner style="width: 42px; height: 42px" stroke-width="4" />
               <p>Loading specification…</p>
            </div>
            <div v-else-if="kind === 'postman'" class="state">
               <Message severity="warn" :closable="false">This file is a Postman collection, not an OpenAPI document. Choose an OpenAPI file such as ezmax.v1.3.json, or Internal.</Message>
            </div>
            <div v-else-if="error" class="state">
               <Message severity="error" :closable="false">{{ error }}</Message>
            </div>
            <router-view v-else />
         </main>
      </div>

      <Dialog v-model:visible="schemaOpen" modal dismissable-mask :style="{ width: 'min(960px, 94vw)' }" :content-style="{ maxHeight: '72vh', overflow: 'auto' }" @hide="closeSchema">
         <template #header>
            <div class="schema-dialog-head">
               <Button v-if="schemaStack.length > 1" icon="pi pi-arrow-left" text rounded size="small" aria-label="Previous schema" @click="backSchema" />
               <span>{{ schemaCurrent }}</span>
            </div>
         </template>
         <XSchemaView v-if="schemaCurrent" :key="schemaCurrent" :name="schemaCurrent" embedded />
      </Dialog>
   </div>
</template>

<script setup lang="ts">
import { computed, markRaw, provide, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import Button from 'primevue/button'
import Select from 'primevue/select'
import Popover from 'primevue/popover'
import ToggleSwitch from 'primevue/toggleswitch'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import ProgressSpinner from 'primevue/progressspinner'
import Message from 'primevue/message'
import Dialog from 'primevue/dialog'
import { useGlobalStore } from 'src/stores/global'
import { openApiKey } from 'src/composables/use-openapi'
import { schemaDialogKey } from 'src/composables/use-schema-dialog'
import XSchemaView from 'src/components/schema-view/x-schema-view.vue'
import { buildNav, type NavOperation } from 'src/utils/nav'
import { queryScore } from 'src/utils/search'
import { documentKind, formatTag, prepareDocument } from 'src/utils/openapi'
import { SPECS_PAGE, fallbackRemoteSpecs, internalSpec, specFromGithubFile, type SpecChoice } from 'src/utils/specs'

const route = useRoute()
const router = useRouter()
const store = useGlobalStore()

const documentModel = ref<any>()
const rawText = ref('')
const loading = ref(false)
const error = ref('')
const kind = ref<'' | 'openapi' | 'postman' | 'unknown'>('')
const specs = ref<SpecChoice[]>([internalSpec()])
const specId = ref(store.specId || 'internal')
const theSearch = ref('')
const navOpen = ref(false)
const sidebarWidth = ref(320)
const openTag = ref(typeof route.params.object === 'string' ? route.params.object : '')
const settingsPopover = ref<any>()
const hydrated = ref(false)
const schemaStack = ref<string[]>([])
const schemaCurrent = computed(() => schemaStack.value.at(-1) || '')
const schemaOpen = computed({
   get: () => schemaStack.value.length > 0,
   set: (open: boolean) => {
      if (!open) schemaStack.value = []
   }
})

function openSchema(name: string) {
   if (!name) return
   schemaStack.value = [...schemaStack.value, name]
   navOpen.value = false
}

function backSchema() {
   schemaStack.value = schemaStack.value.slice(0, -1)
}

function closeSchema() {
   schemaStack.value = []
}
const specsPage = SPECS_PAGE
const textSizes = [
   { value: 0, label: 'S', name: 'Compact' },
   { value: 1, label: 'M', name: 'Regular' },
   { value: 2, label: 'L', name: 'Large' },
   { value: 3, label: 'XL', name: 'Extra large' }
]

const nav = computed(() => (documentModel.value ? buildNav(documentModel.value) : undefined))
const title = computed(() => documentModel.value?.info?.title || 'OpenAPI Reader')
const version = computed(() => documentModel.value?.info?.version || '')
const logoUrl = computed(() => (store.darkMode ? '/logo-dark.svg' : '/logo-light.svg'))
const logoAlt = 'eZmax'
const needle = computed(() => theSearch.value.trim().toLowerCase())

const searchPlaceholder = computed(() => {
   if (store.searchInName && store.searchInDescription) return 'Routes and descriptions'
   if (store.searchInDescription) return 'Descriptions'
   return 'Route name'
})
const groupedSpecs = computed(() => [
   { label: 'Local', items: specs.value.filter((spec) => spec.group === 'Local') },
   { label: 'eZmax API', items: specs.value.filter((spec) => spec.group === 'eZmax API') }
])

const visibleGroups = computed(() => {
   if (!nav.value) return []
   return nav.value.groups
      .map((group) => ({
         ...group,
         tags: group.tags.filter((tag) => tagVisible(tag))
      }))
      .filter((group) => group.tags.length)
})

const schemaCount = computed(() => nav.value?.schemas.length || 0)

const matchingSchemas = computed(() => {
   if (!nav.value) return []
   if (!needle.value) return nav.value.schemas
   return nav.value.schemas.filter((name) => queryScore(name, needle.value) > 0)
})

const schemaMatchCount = computed(() => matchingSchemas.value.length)

const schemaMatches = computed(() => matchingSchemas.value.slice(0, needle.value ? 80 : 200))

const webhooksExpanded = computed(() => store.webhooksOpen || Boolean(needle.value))

const visibleWebhooks = computed(() => {
   if (!nav.value) return []
   return nav.value.webhooks.filter((webhook) => {
      if (!store.showDeprecated && webhook.deprecated) return false
      if (!needle.value) return true
      const parts = []
      if (store.searchInName) parts.push(webhook.name, webhook.summary, webhook.method)
      if (store.searchInDescription) parts.push(webhook.searchDescription)
      return queryScore(parts.join('\n'), needle.value) > 0
   })
})

function specFileName(id: string) {
   if (!id) return 'Spec'
   if (id === 'internal') return 'internal.json'
   return id
}

function operationHaystack(operation: NavOperation) {
   const parts = []
   if (store.searchInName) parts.push(operation.searchName)
   if (store.searchInDescription) parts.push(operation.searchDescription)
   return parts.join('\n')
}

function tagVisible(tag: string) {
   if (!needle.value) return operationsFor(tag).length > 0 || !nav.value?.byTag[tag]
   if (queryScore(`${formatTag(tag)} ${tag}`, needle.value) > 0) return true
   return operationsFor(tag).length > 0
}

function operationsFor(tag: string) {
   const operations = (nav.value?.byTag[tag] || []).filter((operation) => store.showDeprecated || !operation.deprecated)
   if (!needle.value) return operations
   if (queryScore(`${formatTag(tag)} ${tag}`, needle.value) > 0) return operations
   return operations
      .map((operation) => ({ operation, score: queryScore(operationHaystack(operation), needle.value) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.operation.order - b.operation.order)
      .map((item) => item.operation)
}

function isOpen(tag: string) {
   if (needle.value) return true
   return openTag.value === tag
}

function isActiveTag(tag: string) {
   return route.params.object === tag && !route.params.operation
}

function isActiveOperation(tag: string, operation: NavOperation) {
   return route.params.object === tag && route.params.operation === operation.operationId
}

function onTag(tag: string) {
   if (operationsFor(tag).length && !needle.value && openTag.value === tag) {
      openTag.value = ''
      return
   }
   openTag.value = tag
   router.push({ name: 'page-details', params: { object: tag } })
   navOpen.value = false
}

function openSettings(event: Event) {
   settingsPopover.value?.toggle(event)
}

function downloadSpec() {
   const blob = new Blob([rawText.value], { type: 'application/json' })
   const url = URL.createObjectURL(blob)
   const link = document.createElement('a')
   link.href = url
   link.download = specId.value === 'internal' ? 'internal.json' : specId.value
   link.click()
   URL.revokeObjectURL(url)
}

function startResize(event: MouseEvent) {
   const startX = event.clientX
   const startWidth = sidebarWidth.value
   const move = (moveEvent: MouseEvent) => {
      sidebarWidth.value = Math.min(560, Math.max(240, startWidth + moveEvent.clientX - startX))
   }
   const stop = () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', stop)
   }
   window.addEventListener('mousemove', move)
   window.addEventListener('mouseup', stop)
}

let requestId = 0

async function loadSpec(id: string) {
   const choice = specs.value.find((spec) => spec.id === id) || internalSpec()
   if (choice.disabled) {
      error.value = 'Cette spécification est trop volumineuse pour être chargée dans le navigateur.'
      return
   }
   const current = ++requestId
   loading.value = true
   error.value = ''
   try {
      const url = choice.local ? '/specs/internal.json' : choice.url
      const response = await axios.get(url || '', {
         responseType: 'text',
         transformResponse: [(data) => data],
         timeout: 120000
      })
      if (current !== requestId) return
      const text = String(response.data || '')
      const json = JSON.parse(text)
      const detected = documentKind(json)
      rawText.value = text
      kind.value = detected
      documentModel.value = detected === 'openapi' ? markRaw(prepareDocument(json)) : undefined
      if (detected === 'unknown') error.value = 'Ce fichier n’est pas une spécification OpenAPI.'
      store.specId = id
   } catch (cause: any) {
      if (current !== requestId) return
      documentModel.value = undefined
      rawText.value = ''
      kind.value = ''
      error.value = cause?.message || 'Impossible de charger la spécification.'
   } finally {
      if (current === requestId) loading.value = false
   }
}

async function refreshCatalog() {
   try {
      const response = await axios.get('https://api.github.com/repos/eZmaxinc/eZmax-API/contents/specs', {
         headers: { Accept: 'application/vnd.github+json' },
         timeout: 20000
      })
      const remote = (response.data as any[]).map((file) => specFromGithubFile(file)).filter((spec): spec is SpecChoice => Boolean(spec))
      specs.value = [internalSpec(), ...remote]
   } catch {
      specs.value = [internalSpec(), ...fallbackRemoteSpecs()]
   }
}

watch(specId, async (id) => {
   if (!hydrated.value) return
   await loadSpec(id)
   if (route.name !== 'home') router.push({ name: 'home' })
})

watch(
   () => route.fullPath,
   () => {
      navOpen.value = false
      if (typeof route.params.object === 'string') openTag.value = route.params.object
   }
)

provide(schemaDialogKey, openSchema)

provide(openApiKey, {
   document: documentModel,
   rawText,
   loading,
   error,
   kind,
   specs,
   specId
})

refreshCatalog().then(async () => {
   const saved = specs.value.find((spec) => spec.id === specId.value && !spec.disabled)
   const id = saved?.id || 'internal'
   specId.value = id
   await loadSpec(id)
   hydrated.value = true
})
</script>
