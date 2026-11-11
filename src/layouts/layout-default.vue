<template>
   <div class="shell">
      <header class="topbar">
         <Button class="menu-btn" icon="pi pi-bars" text rounded aria-label="Open navigation" @click="navOpen = true" />
         <div class="brand">
            <img v-if="logoUrl" class="logo" :src="logoUrl" :alt="logoAlt" />
            <h1 :title="title">{{ title }}</h1>
            <span v-if="version" class="version">v{{ version }}</span>
         </div>

         <div class="spec-upload">
            <input ref="specFile" type="file" accept="application/json,.json" class="spec-file" aria-label="Importer un JSON" @change="onUpload" />
            <div v-if="!uploadedName" class="spec-actions">
               <button type="button" class="spec-upload-btn" :disabled="loading && !documentModel" @click="specFile?.click()">
                  <i class="pi pi-upload"></i>
                  <span>Upload JSON Spec</span>
               </button>
               <button
                  type="button"
                  class="spec-branch-btn"
                  :disabled="loading"
                  title="Choose specification branch"
                  aria-label="Choose specification branch"
                  @click="openBranchMenu"
               >
                  <i :class="loading ? 'pi pi-spin pi-spinner' : 'pi pi-code-fork'"></i>
                  <span class="spec-branch-name">{{ currentBranchLabel }}</span>
                  <i class="pi pi-chevron-down spec-branch-caret"></i>
               </button>
               <Popover ref="branchPopover" class="branch-popover" @show="onBranchPopoverShow">
                  <div class="spec-branch-menu">
                     <div class="spec-branch-menu-head">
                        <span>Branch / Environment</span>
                     </div>
                     <button
                        v-for="branch in availableBranches"
                        :key="branch.id"
                        type="button"
                        class="spec-branch-menu-item"
                        :class="{ active: currentBranch === branch.id }"
                        @click="selectBranch(branch.id)"
                     >
                        <div class="spec-branch-menu-item-info">
                           <span class="spec-branch-menu-item-name">{{ branch.label }}</span>
                           <span class="spec-branch-menu-item-desc">{{ branch.description }}</span>
                        </div>
                        <i v-if="currentBranch === branch.id" class="pi pi-check spec-branch-menu-item-check"></i>
                     </button>
                  </div>
               </Popover>
            </div>
            <span v-else class="spec-chip" :title="'JSON actif : ' + uploadedName">
               <span class="spec-chip-state">JSON actif</span>
               <span class="spec-chip-name">{{ uploadedName }}</span>
               <button type="button" class="spec-chip-clear" aria-label="Retirer le JSON importé" @click="clearUpload">
                  <i class="pi pi-times"></i>
               </button>
            </span>
         </div>

         <div class="top-actions">
            <Button class="portal-link" label="Portail développeur" icon="pi pi-external-link" size="small" as="a" href="https://ezmax.dev" target="_blank" rel="noreferrer" />
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
                  <label><ToggleSwitch v-model="store.showDescription" size="small" /> Descriptions</label>
                  <label><ToggleSwitch v-model="store.showObjectNames" size="small" /> Object names</label>
                  <label><ToggleSwitch v-model="store.showFieldObject" size="small" /> Show field object</label>
                  <label><ToggleSwitch v-model="store.showXParameters" size="small" /> Show x parameters</label>
                  <label><ToggleSwitch v-model="store.showProperties" size="small" /> Expand advanced properties</label>
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
                  <button
                     type="button"
                     class="search-toggle-expand"
                     :class="{ active: store.expandRoutesOnSearch }"
                     :title="store.expandRoutesOnSearch ? 'Routes ouvertes lors de la recherche (cliquer pour fermer)' : 'Routes fermées lors de la recherche (cliquer pour ouvrir)'"
                     :aria-label="store.expandRoutesOnSearch ? 'Routes ouvertes' : 'Routes fermées'"
                     @click="store.expandRoutesOnSearch = !store.expandRoutesOnSearch"
                  >
                     <i :class="store.expandRoutesOnSearch ? 'pi pi-folder-open' : 'pi pi-folder'"></i>
                  </button>
                  <button type="button" class="search-advanced" :class="{ active: store.searchOptionsOpen || store.searchInDescription || store.showDeprecated || Boolean(store.searchPropertyFilters.length) }" :aria-expanded="store.searchOptionsOpen" title="Search options" @click="store.searchOptionsOpen = !store.searchOptionsOpen">
                     <i class="pi pi-sliders-h"></i>
                  </button>
               </div>
               <div v-show="store.searchOptionsOpen" class="search-options">
                  <label><ToggleSwitch v-model="store.searchInName" /> Route name</label>
                  <label><ToggleSwitch v-model="store.searchInDescription" /> Descriptions</label>
                  <label><ToggleSwitch v-model="store.showDeprecated" /> deprecated</label>
                  <div v-if="groupedXProperties.length" class="prop-filter-wrap">
                     <button type="button" class="prop-filter-trigger" @click="togglePropPicker">
                        <div class="prop-filter-chips">
                           <span v-if="!store.searchPropertyFilters.length" class="placeholder">Properties</span>
                           <span v-for="key in store.searchPropertyFilters" :key="key" class="p-chip">
                              <span class="p-chip-label">{{ labelForFilter(key) }}</span>
                              <TimesIcon class="p-chip-remove-icon" @click.stop="removeFilter(key)" />
                           </span>
                        </div>
                        <span class="prop-dropdown-arrow"></span>
                     </button>
                     <Popover ref="propPopover" class="search-prop-popover">
                        <div class="prop-picker">
                           <div class="prop-picker-header">
                              <IconField class="prop-picker-search">
                                 <InputIcon class="pi pi-search" />
                                 <InputText v-model="propSearch" placeholder="Search..." size="small" fluid />
                                 <button v-if="propSearch" type="button" class="search-clear" aria-label="Clear" @click="propSearch = ''">
                                    <i class="pi pi-times"></i>
                                 </button>
                              </IconField>
                              <Button v-if="store.searchPropertyFilters.length" label="Clear all" text size="small" class="clear-all-btn" @click="store.searchPropertyFilters = []" />
                           </div>
                           <div class="prop-groups-list">
                              <div v-for="group in filteredPropGroups" :key="group.label" class="prop-group">
                                 <button type="button" class="prop-group-head" @click="toggleGroupCollapse(group.label)">
                                    <span class="caret" :class="{ open: !collapsedGroups[group.label] }"></span>
                                    <span class="nav-title"><span class="prop-group-title">{{ group.label }}</span><span class="prop-group-count">{{ group.items.length }}</span></span>
                                 </button>
                                 <div v-show="!collapsedGroups[group.label]" class="prop-group-items">
                                    <label v-for="item in group.items" :key="item.key" class="prop-item" :class="{ selected: isFilterSelected(item.key) }">
                                       <input type="checkbox" :checked="isFilterSelected(item.key)" @change="toggleFilter(item.key)" />
                                       <span class="prop-item-label">{{ item.label }}</span>
                                    </label>
                                 </div>
                              </div>
                              <p v-if="!filteredPropGroups.length" class="prop-empty">No properties match</p>
                           </div>
                        </div>
                     </Popover>
                  </div>
               </div>
            </div>
            <div class="sidebar-scroll">
               <div class="manual-nav">
                  <RouterLink class="changelog-nav" :class="{ active: route.name === 'home' }" :to="{ name: 'home' }" @click="navOpen = false">Introduction</RouterLink>
                  <RouterLink class="changelog-nav" :class="{ active: route.name === 'changelog' }" :to="{ name: 'changelog' }" @click="navOpen = false">Changelog</RouterLink>
               </div>
               <section v-for="group in visibleGroups" :key="group.name" class="nav-group">
                  <h2><span class="nav-title">{{ group.name }}<span class="nav-count">{{ group.tags.length }}</span></span></h2>
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
                     <span class="nav-title">Webhooks<span class="nav-count">{{ visibleWebhooks.length }}</span></span>
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
                     <span class="nav-title">Schemas<span class="nav-count">{{ schemaMatchCount }}</span></span>
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
import { computed, markRaw, provide, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import Button from 'primevue/button'
import Popover from 'primevue/popover'
import TimesIcon from '@primevue/icons/times'
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
import {
   DEFAULT_BRANCH,
   SPEC_BRANCH_STORAGE_KEY,
   SPEC_FILES_TO_TRY,
   rawSpecBranchUrl,
   specsBranchUrl,
   type SpecBranch
} from 'src/utils/specs'

const route = useRoute()
const router = useRouter()
const store = useGlobalStore()

const documentModel = ref<any>()
const rawText = ref('')
const loading = ref(false)
const error = ref('')
const kind = ref<'' | 'openapi' | 'postman' | 'unknown'>('')
const SESSION_KEY = 'or-upload-session'
const SPEC_DB = 'or-uploaded-spec'
const SPEC_STORE = 'specs'
const specFile = ref<HTMLInputElement>()
const uploadedName = ref('')
const theSearch = ref('')
const navOpen = ref(false)
const sidebarWidth = ref(320)
const openTag = ref(typeof route.params.object === 'string' ? route.params.object : '')
const searchOpenTags = ref(new Set<string>())
const searchClosedTags = ref(new Set<string>())
const settingsPopover = ref<any>()
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

const currentBranch = ref<SpecBranch>(readInitialBranch())

function readInitialBranch(): SpecBranch {
   const saved = sessionStorage.getItem(SPEC_BRANCH_STORAGE_KEY)
   return saved === 'develop' ? 'develop' : DEFAULT_BRANCH
}

const currentBranchLabel = computed(() => (currentBranch.value === 'develop' ? 'Develop' : 'Master'))
const otherBranchLabel = computed(() => (currentBranch.value === 'develop' ? 'Master' : 'Develop'))
const specsPage = computed(() => specsBranchUrl(currentBranch.value))

const branchPopover = ref<any>()

const availableBranches: { id: SpecBranch; label: string; description: string }[] = [
   { id: 'master', label: 'Master', description: 'Main branch (stable)' },
   { id: 'develop', label: 'Develop', description: 'Development branch' }
]

const branchBtnEl = ref<HTMLElement | null>(null)

function openBranchMenu(event: Event) {
   branchBtnEl.value = event.currentTarget as HTMLElement
   branchPopover.value?.toggle(event)
}

function onBranchPopoverShow() {
   requestAnimationFrame(() => {
      const container = (branchPopover.value as any)?.container as HTMLElement
      const btn = branchBtnEl.value
      if (container && btn) {
         const btnRect = btn.getBoundingClientRect()
         const popRect = container.getBoundingClientRect()
         const arrowCenter = btnRect.left + btnRect.width / 2 - popRect.left
         container.style.setProperty('--branch-arrow-left', `${Math.round(arrowCenter)}px`)
      }
   })
}

async function selectBranch(branch: SpecBranch) {
   branchPopover.value?.hide()
   if (currentBranch.value === branch) return
   if (loading.value) return
   currentBranch.value = branch
   sessionStorage.setItem(SPEC_BRANCH_STORAGE_KEY, branch)
   await loadDefault()
   if (route.name !== 'home') router.push({ name: 'home' })
}

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

const groupedXProperties = computed(() => {
   if (!nav.value) return []
   const propertyCounts = new Map<string, number>()
   const valueCounts = new Map<string, Map<string, number>>()
   const seenOps = new Set<string>()
   const visibleTagSet = new Set<string>(nav.value.groups.flatMap((group) => group.tags))

   for (const [tag, ops] of Object.entries(nav.value.byTag)) {
      if (!visibleTagSet.has(tag)) continue
      for (const op of ops) {
         if (!store.showDeprecated && op.deprecated) continue
         const opKey = `${op.method}:${op.route}`
         if (seenOps.has(opKey)) continue
         seenOps.add(opKey)

         for (const item of op.xProperties || []) {
            if (item.includes(':')) {
               const colonIdx = item.indexOf(':')
               const prop = item.slice(0, colonIdx)
               const val = item.slice(colonIdx + 1)
               if (!valueCounts.has(prop)) valueCounts.set(prop, new Map())
               const valMap = valueCounts.get(prop)!
               valMap.set(val, (valMap.get(val) || 0) + 1)
            } else {
               propertyCounts.set(item, (propertyCounts.get(item) || 0) + 1)
            }
         }
      }
   }

   const groups: { label: string; items: { key: string; label: string }[] }[] = []

   for (const [prop, total] of propertyCounts.entries()) {
      const propTitle = prop.replace(/^x-/, '').toUpperCase()
      const valMap = valueCounts.get(prop)

      // If it's a simple boolean flag (only 'true' or no values)
      if (!valMap || valMap.size === 0 || (valMap.size === 1 && valMap.has('true'))) {
         groups.push({
            label: propTitle,
            items: [{ key: prop, label: `Any (${total})` }]
         })
      } else {
         const items = [{ key: prop, label: `Any (${total})` }]
         const subItems = Array.from(valMap.entries())
            .map(([val, count]) => ({
               key: `${prop}:${val}`,
               label: `${val} (${count})`
            }))
            .sort((a, b) => a.label.localeCompare(b.label))
         items.push(...subItems)
         groups.push({
            label: propTitle,
            items
         })
      }
   }

   return groups.sort((a, b) => a.label.localeCompare(b.label))
})

const propPopover = ref<any>()
const propSearch = ref('')
const collapsedGroups = reactive<Record<string, boolean>>({})

function togglePropPicker(event: Event) {
   propPopover.value?.toggle(event)
}

function toggleGroupCollapse(label: string) {
   collapsedGroups[label] = !collapsedGroups[label]
}

function isFilterSelected(key: string) {
   return store.searchPropertyFilters.includes(key)
}

function toggleFilter(key: string) {
   if (store.searchPropertyFilters.includes(key)) {
      store.searchPropertyFilters = store.searchPropertyFilters.filter((k) => k !== key)
   } else {
      store.searchPropertyFilters = [...store.searchPropertyFilters, key]
   }
}

function removeFilter(key: string) {
   store.searchPropertyFilters = store.searchPropertyFilters.filter((k) => k !== key)
}

function labelForFilter(key: string): string {
   for (const group of groupedXProperties.value) {
      const match = group.items.find((item) => item.key === key)
      if (match) {
         if (key.includes(':')) {
            const val = key.slice(key.indexOf(':') + 1)
            return `${group.label}: ${val}`
         }
         return `${group.label}`
      }
   }
   return key.replace(/^x-/, '').toUpperCase()
}

const filteredPropGroups = computed(() => {
   const q = propSearch.value.trim().toLowerCase()
   if (!q) return groupedXProperties.value
   return groupedXProperties.value
      .map((group) => {
         const groupMatches = group.label.toLowerCase().includes(q)
         const items = group.items.filter((item) => groupMatches || item.label.toLowerCase().includes(q))
         return { ...group, items }
      })
      .filter((group) => group.items.length > 0)
})

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

function operationHaystack(operation: NavOperation) {
   const parts = []
   if (store.searchInName) parts.push(operation.searchName)
   if (store.searchInDescription) parts.push(operation.searchDescription)
   return parts.join('\n')
}

function tagVisible(tag: string) {
   if (store.searchPropertyFilters.length) {
      return operationsFor(tag).length > 0
   }
   if (!needle.value) {
      return operationsFor(tag).length > 0 || !nav.value?.byTag[tag]
   }
   if (queryScore(`${formatTag(tag)} ${tag}`, needle.value) > 0) return true
   return operationsFor(tag).length > 0
}

function operationsFor(tag: string) {
   let operations = (nav.value?.byTag[tag] || []).filter((operation) => store.showDeprecated || !operation.deprecated)
   if (store.searchPropertyFilters.length) {
      const byGroup = new Map<string, string[]>()
      for (const filterKey of store.searchPropertyFilters) {
         const prop = filterKey.includes(':') ? filterKey.slice(0, filterKey.indexOf(':')) : filterKey
         if (!byGroup.has(prop)) byGroup.set(prop, [])
         byGroup.get(prop)!.push(filterKey)
      }
      operations = operations.filter((op) => {
         for (const groupKeys of byGroup.values()) {
            if (!groupKeys.some((k) => op.xProperties?.includes(k))) return false
         }
         return true
      })
   }
   if (!needle.value) return operations
   if (queryScore(`${formatTag(tag)} ${tag}`, needle.value) > 0) return operations
   return operations
      .map((operation) => ({ operation, score: queryScore(operationHaystack(operation), needle.value) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.operation.order - b.operation.order)
      .map((item) => item.operation)
}

function isOpen(tag: string) {
   if (needle.value || store.searchPropertyFilters.length) {
      if (searchOpenTags.value.has(tag)) return true
      if (searchClosedTags.value.has(tag)) return false
      return store.expandRoutesOnSearch
   }
   return openTag.value === tag
}

function isActiveTag(tag: string) {
   return route.params.object === tag && !route.params.operation
}

function isActiveOperation(tag: string, operation: NavOperation) {
   return route.params.object === tag && route.params.operation === operation.operationId
}

function onTag(tag: string) {
   if (needle.value || store.searchPropertyFilters.length) {
      if (operationsFor(tag).length) {
         if (isOpen(tag)) {
            searchOpenTags.value.delete(tag)
            searchClosedTags.value.add(tag)
         } else {
            searchClosedTags.value.delete(tag)
            searchOpenTags.value.add(tag)
         }
         return
      }
   }
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

function openSpecDb() {
   return new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(SPEC_DB, 1)
      request.onupgradeneeded = () => {
         if (!request.result.objectStoreNames.contains(SPEC_STORE)) request.result.createObjectStore(SPEC_STORE)
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
   })
}

function sessionId() {
   let id = sessionStorage.getItem(SESSION_KEY)
   if (!id) {
      id = crypto.randomUUID()
      sessionStorage.setItem(SESSION_KEY, id)
   }
   return id
}

async function saveUpload(name: string, text: string) {
   const db = await openSpecDb()
   const id = sessionId()
   await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(SPEC_STORE, 'readwrite')
      tx.objectStore(SPEC_STORE).put({ name, text }, id)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
   })
   db.close()
}

async function readStoredUpload(): Promise<{ name: string; text: string } | undefined> {
   const id = sessionStorage.getItem(SESSION_KEY)
   const db = await openSpecDb()
   try {
      const records = await new Promise<{ key: IDBValidKey; value: { name?: string; text?: string } }[]>((resolve, reject) => {
         const tx = db.transaction(SPEC_STORE, 'readwrite')
         const store = tx.objectStore(SPEC_STORE)
         const found: { key: IDBValidKey; value: { name?: string; text?: string } }[] = []
         const cursor = store.openCursor()
         cursor.onsuccess = () => {
            const current = cursor.result
            if (!current) return
            if (current.key !== id) store.delete(current.key)
            else found.push({ key: current.key, value: current.value })
            current.continue()
         }
         tx.oncomplete = () => resolve(found)
         tx.onerror = () => reject(tx.error)
      })
      const value = records[0]?.value
      if (!value?.name || typeof value.text !== 'string') return undefined
      return { name: value.name, text: value.text }
   } finally {
      db.close()
   }
}

async function forgetUpload() {
   const id = sessionStorage.getItem(SESSION_KEY)
   sessionStorage.removeItem(SESSION_KEY)
   if (!id) return
   const db = await openSpecDb()
   await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(SPEC_STORE, 'readwrite')
      tx.objectStore(SPEC_STORE).delete(id)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
   })
   db.close()
}

function applyText(text: string) {
   const json = JSON.parse(text)
   const detected = documentKind(json)
   rawText.value = text
   kind.value = detected
   documentModel.value = detected === 'openapi' ? markRaw(prepareDocument(json)) : undefined
   error.value = detected === 'openapi' ? '' : 'This file is not an OpenAPI specification.'
}

async function loadDefault() {
   const current = ++requestId
   loading.value = true
   error.value = ''
   uploadedName.value = ''
   const branch = currentBranch.value

   let loadedText = ''

   for (const fileName of SPEC_FILES_TO_TRY) {
      if (current !== requestId) return
      const url = rawSpecBranchUrl(branch, fileName)
      try {
         const response = await axios.get(url, {
            responseType: 'text',
            transformResponse: [(data) => data],
            timeout: 60000
         })
         if (response.status === 200 && response.data) {
            loadedText = String(response.data)
            break
         }
      } catch {
         // Try fallback file if primary does not exist
      }
   }

   if (current !== requestId) return

   if (loadedText) {
      try {
         applyText(loadedText)
      } catch (cause: any) {
         documentModel.value = undefined
         rawText.value = ''
         kind.value = ''
         error.value = cause?.message || 'Invalid specification content.'
      }
   } else {
      documentModel.value = undefined
      rawText.value = ''
      kind.value = ''
      error.value = `Unable to load specification for branch "${branch}" (files ezmax.openapi.json and ezmax.v1.3.json not found).`
   }

   if (current === requestId) loading.value = false
}

async function onUpload(event: Event) {
   const input = event.target as HTMLInputElement
   const file = input.files?.[0]
   input.value = ''
   if (!file) return
   const current = ++requestId
   loading.value = true
   error.value = ''
   try {
      const text = await file.text()
      JSON.parse(text)
      if (current !== requestId) return
      let kept = true
      try {
         await saveUpload(file.name, text)
      } catch {
         kept = false
      }
      if (current !== requestId) return
      uploadedName.value = file.name
      applyText(text)
      if (!kept && !error.value) error.value = 'Failed to store file for this session.'
      if (route.name !== 'home') router.push({ name: 'home' })
   } catch {
      if (current !== requestId) return
      error.value = 'This JSON file is invalid.'
   } finally {
      if (current === requestId) loading.value = false
   }
}

async function clearUpload() {
   await forgetUpload()
   loadDefault()
   if (route.name !== 'home') router.push({ name: 'home' })
}

watch(
   () => route.fullPath,
   () => {
      navOpen.value = false
      if (typeof route.params.object === 'string') openTag.value = route.params.object
   }
)

watch(
   () => [theSearch.value, store.searchPropertyFilters.length, store.expandRoutesOnSearch],
   () => {
      searchOpenTags.value.clear()
      searchClosedTags.value.clear()
   }
)

provide(schemaDialogKey, openSchema)

provide(openApiKey, {
   document: documentModel,
   rawText,
   loading,
   error,
   kind,
   uploadedName
})

readStoredUpload()
   .then((storedUpload) => {
      if (!storedUpload) return loadDefault()
      uploadedName.value = storedUpload.name
      try {
         applyText(storedUpload.text)
      } catch {
         forgetUpload()
         uploadedName.value = ''
         return loadDefault()
      }
   })
   .catch(() => loadDefault())
</script>
