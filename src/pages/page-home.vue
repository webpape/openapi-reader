<template>
   <article class="page home-page" v-if="document">
      <header class="page-header home-hero">
         <h2>{{ document.info?.title }}</h2>
         <p v-if="document.info?.version" class="lede">Version {{ document.info.version }}</p>
         <section class="intro-panel">
            <p class="intro-lead">Welcome to the eZmax API Reference.</p>
            <p>The API provides programmatic access to the eZmax and eZsign platforms, allowing applications and services to integrate with and automate platform capabilities.</p>
            <p>This reference describes the API contract, including endpoints, HTTP methods, parameters, request and response schemas, and response codes.</p>
            <p class="intro-links">
               For integration guides, authentication, environments, and examples, visit
               <a href="https://ezmax.dev" target="_blank" rel="noreferrer">ezmax.dev</a>
               .
            </p>
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

      <section v-if="document.externalDocs?.url || document.info?.contact || document.info?.license" class="home-section meta-row">
         <a v-if="document.info?.contact?.url" :href="document.info.contact.url" target="_blank" rel="noreferrer">{{ document.info.contact.name || document.info.contact.email || 'Contact' }}</a>
         <a v-else-if="document.info?.contact?.email" :href="'mailto:' + document.info.contact.email">{{ document.info.contact.email }}</a>
         <a v-if="document.info?.license?.url" :href="document.info.license.url" target="_blank" rel="noreferrer">{{ document.info.license.name || 'License' }}</a>
         <a v-if="document.info?.termsOfService" :href="document.info.termsOfService" target="_blank" rel="noreferrer">Terms of service</a>
         <a v-if="document.externalDocs?.url" :href="document.externalDocs.url" target="_blank" rel="noreferrer">{{ document.externalDocs.description || 'External docs' }}</a>
      </section>
   </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useOpenApi } from 'src/composables/use-openapi'
import { tagGroupsOf, webhooksOf } from 'src/utils/openapi'
import { operationCount } from 'src/utils/nav'

const { document } = useOpenApi()

const operations = computed(() => operationCount(document.value))
const schemas = computed(() => Object.keys(document.value?.components?.schemas || document.value?.definitions || {}).length)
const webhooks = computed(() => Object.keys(webhooksOf(document.value)).length)
const tagGroups = computed(() => tagGroupsOf(document.value))
const groups = computed(() => tagGroups.value.length)
</script>
