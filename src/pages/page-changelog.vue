<template>
   <article class="page changelog-page">
      <header class="page-header">
         <p class="kicker">Notes de version</p>
         <h2>Changelog</h2>
      </header>
      <p v-if="error" class="section-note">{{ error }}</p>
      <XMarkdown v-else-if="source" class="changelog-body" :source="source" />
   </article>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import XMarkdown from 'src/components/markdown-view/x-markdown.vue'

const source = ref('')
const error = ref('')
const METHODS = 'GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS|TRACE'

function withMethodBadges(markdown: string) {
   return markdown.replace(new RegExp(`^(\\s*(?:[-*+]\\s+)?)(${METHODS})\\b\\s+(/\\S+)`, 'gm'), (_match, prefix: string, method: string, path: string) => {
      const name = method.toLowerCase()
      return `${prefix}<span class="changelog-endpoint"><span class="method m-${name}">${name}</span><span class="changelog-route">${path}</span></span>`
   })
}

onMounted(async () => {
   try {
      const response = await fetch('/specs/changelog.md')
      if (!response.ok) throw new Error(String(response.status))
      source.value = withMethodBadges(await response.text())
   } catch {
      error.value = 'Impossible de charger le changelog.'
   }
})
</script>
