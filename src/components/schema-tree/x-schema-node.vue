<template>
   <div class="schema-node" :class="{ nested: depth > 0 }">
      <div class="schema-node-head" @click="onToggle">
         <button v-if="node.children.length" type="button" class="tree-caret" :aria-expanded="open" :aria-label="open ? 'Collapse' : 'Expand'" @click.stop="onToggle">
            <i class="pi" :class="open ? 'pi-chevron-down' : 'pi-chevron-right'"></i>
         </button>
         <span v-else class="chevron-spacer"></span>
         <span class="schema-label" :class="{ deprecated: node.deprecated }">{{ node.label }}</span>
         <span v-if="node.required" class="required-mark" title="Required">*</span>
         <XBadgeObjectType :type="node.typeLabel" :schema-name="node.schemaName" :schema-names="node.schemaNames" />
         <span v-if="node.format" class="chip chip-format">{{ node.format }}</span>
         <span v-if="node.nullable" class="chip">nullable</span>
         <span v-if="node.readOnly" class="chip">readOnly</span>
         <span v-if="node.writeOnly" class="chip">writeOnly</span>
         <span v-if="node.deprecated" class="chip chip-warn">deprecated</span>
         <span v-if="node.recursive" class="chip chip-warn">recursive</span>
         <span v-if="node.discriminator" class="chip">discriminator: {{ node.discriminator }}</span>
         <XBadgeLength :min-length="node.minLength" :max-length="node.maxLength" />
         <XBadgeMinimumMaximum :minimum="node.minimum" :maximum="node.maximum" :min-exclusive="node.minExclusive" :max-exclusive="node.maxExclusive" />
         <XBadgePattern :pattern="node.pattern" />
      </div>

      <div v-if="open && hasBody" class="schema-node-body">
         <XMarkdown v-if="store.showDescription && node.description" class="schema-description" :source="node.description" />
         <div v-if="node.enumValues.length" class="enum-row">
            <span v-for="value in node.enumValues" :key="String(value)" class="enum-chip">{{ formatEnum(value) }}</span>
         </div>
         <span v-if="node.defaultValue !== undefined" class="chip">default {{ formatEnum(node.defaultValue) }}</span>
         <p v-if="node.note" class="schema-meta">{{ node.note }}</p>
         <XSchemaNode v-for="child in node.children" :key="child.key" :node="child" :depth="depth + 1" :expanded="expanded" :expand-token="expandToken" />
      </div>
   </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useGlobalStore } from 'src/stores/global'
import type { SchemaNode } from 'src/utils/schema-tree'
import XBadgeLength from 'src/components/badge-length'
import XBadgeMinimumMaximum from 'src/components/badge-minimum-maximum'
import XBadgeObjectType from 'src/components/badge-object-type'
import XBadgePattern from 'src/components/badge-pattern'
import XMarkdown from 'src/components/markdown-view/x-markdown.vue'

defineOptions({ name: 'XSchemaNode' })

const props = withDefaults(
   defineProps<{
      node: SchemaNode
      depth?: number
      expanded?: boolean
      expandToken?: number
   }>(),
   { depth: 0, expanded: true, expandToken: 0 }
)

const store = useGlobalStore()
const open = ref(props.expanded || props.node.children.length === 0)
const hasBody = computed(() => Boolean((store.showDescription && props.node.description) || props.node.enumValues.length || props.node.defaultValue !== undefined || props.node.note || props.node.children.length))

watch(
   () => props.expandToken,
   () => {
      open.value = props.expanded || props.node.children.length === 0
   }
)

function onToggle() {
   if (!props.node.children.length) return
   open.value = !open.value
}

function formatEnum(value: unknown) {
   if (typeof value === 'string') return `"${value}"`
   return String(value)
}
</script>
