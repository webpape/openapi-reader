<template>
   <div ref="root" class="markdown" v-html="html"></div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { marked } from 'marked'
import hljs from 'highlight.js'

const props = defineProps<{ source?: string }>()
const root = ref<HTMLElement>()

const html = computed(() => {
   if (!props.source) return ''
   return marked.parse(props.source, { async: false }) as string
})

async function highlight() {
   await nextTick()
   root.value?.querySelectorAll('pre code').forEach((block) => hljs.highlightElement(block as HTMLElement))
}

watch(html, highlight, { immediate: true })
</script>
