<template>
   <article class="page home-page" v-if="document">
      <header class="page-header home-hero">
         <p class="kicker">{{ document.openapi || document.swagger }}</p>
         <h2>{{ document.info?.title }}</h2>
         <p v-if="document.info?.version" class="lede">Version {{ document.info.version }}</p>
         <section class="intro-panel">
            <p class="intro-lead">Welcome to the eZmax API Reference.</p>
            <p>The API provides programmatic access to the eZmax and eZsign platforms, allowing applications and services to integrate with and automate platform capabilities.</p>
            <p>This reference describes the API contract, including endpoints, HTTP methods, parameters, request and response schemas, and response codes.</p>
            <p class="intro-links">For integration guides, authentication, environments, and examples, visit <a href="https://ezmax.dev" target="_blank" rel="noreferrer">ezmax.dev</a>.</p>
         </section>
      </header>

      <section class="stat-row kpi-row" aria-label="Overview">
         <div class="stat">
            <strong>{{ operations }}</strong>
            <span>Operations</span>
         </div>
         <div class="stat">
            <strong>{{ schemas }}</strong>
            <span>Schemas</span>
         </div>
         <div class="stat">
            <strong>{{ webhooks }}</strong>
            <span>Webhooks</span>
         </div>
         <div class="stat">
            <strong>{{ groups }}</strong>
            <span>Tag groups</span>
         </div>
      </section>

      <section v-if="serverList.length" class="home-section">
         <div class="home-section-head">
            <i class="pi pi-server" aria-hidden="true"></i>
            <h3>Servers</h3>
         </div>
         <div class="home-card-grid">
            <article v-for="server in serverList" :key="server.url" class="info-card">
               <code>{{ server.url }}</code>
               <p>{{ server.description }}</p>
               <ul v-if="server.variables.length">
                  <li v-for="variable in server.variables" :key="variable.name">
                     <strong>{{ variable.name }}</strong>
                     <span v-if="variable.defaultValue"> · {{ variable.defaultValue }}</span>
                     <span v-if="variable.enumValues?.length"> · {{ variable.enumValues.join(', ') }}</span>
                     <small v-if="variable.description">{{ variable.description }}</small>
                  </li>
               </ul>
            </article>
         </div>
      </section>

      <section v-if="securitySchemes.length" class="home-section">
         <div class="home-section-head">
            <i class="pi pi-lock" aria-hidden="true"></i>
            <h3>Authentication</h3>
         </div>
         <div class="home-card-grid home-auth-grid">
            <article v-for="scheme in securitySchemes" :key="scheme.name" class="info-card">
               <div class="card-title">
                  <Tag :value="scheme.name" />
                  <span>{{ scheme.typeLabel }}</span>
               </div>
               <p>{{ scheme.description }}</p>
            </article>
         </div>
      </section>

      <section v-if="document.externalDocs?.url || document.info?.contact || document.info?.license" class="home-section meta-row">
         <a v-if="document.info?.contact?.url" :href="document.info.contact.url" target="_blank" rel="noreferrer">{{ document.info.contact.name || document.info.contact.email || 'Contact' }}</a>
         <a v-else-if="document.info?.contact?.email" :href="'mailto:' + document.info.contact.email">{{ document.info.contact.email }}</a>
         <a v-if="document.info?.license?.url" :href="document.info.license.url" target="_blank" rel="noreferrer">{{ document.info.license.name || 'License' }}</a>
         <a v-if="document.info?.termsOfService" :href="document.info.termsOfService" target="_blank" rel="noreferrer">Terms of service</a>
         <a v-if="document.externalDocs?.url" :href="document.externalDocs.url" target="_blank" rel="noreferrer">{{ document.externalDocs.description || 'External docs' }}</a>
      </section>

      <section v-for="group in tagGroups" :key="group.name" class="home-section">
         <div class="home-section-head">
            <i class="pi pi-folder" aria-hidden="true"></i>
            <span class="home-title"><h3>{{ group.name }}</h3><span class="home-count">{{ group.tags.length }}</span></span>
         </div>
         <div class="tag-cloud">
            <RouterLink v-for="tag in group.tags" :key="tag" :to="{ name: 'page-details', params: { object: tag } }">{{ formatTag(tag) }}</RouterLink>
         </div>
      </section>
   </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Tag from 'primevue/tag'
import { useOpenApi } from 'src/composables/use-openapi'
import { formatTag, tagGroupsOf, webhooksOf } from 'src/utils/openapi'
import { operationCount } from 'src/utils/nav'
import { serverOptions } from 'src/utils/samples'

const { document } = useOpenApi()

const operations = computed(() => operationCount(document.value))
const schemas = computed(() => Object.keys(document.value?.components?.schemas || document.value?.definitions || {}).length)
const webhooks = computed(() => Object.keys(webhooksOf(document.value)).length)
const tagGroups = computed(() => tagGroupsOf(document.value))
const groups = computed(() => tagGroups.value.length)
const serverList = computed(() => serverOptions(document.value?.servers))
const securitySchemes = computed(() => {
   const schemes = document.value?.components?.securitySchemes || {}
   return Object.entries(schemes).map(([name, scheme]: [string, any]) => ({
      name,
      description: scheme.description || '',
      typeLabel: [scheme.type, scheme.scheme, scheme.in].filter(Boolean).join(' · ')
   }))
})
</script>
