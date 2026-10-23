<template>
   <div class="schema-tree">
      <XSchemaNode v-for="node in nodes" :key="node.key" :node="node" :expanded="expanded" :expand-token="expandToken" />
      <p v-if="!nodes.length" class="tree-empty">No fields</p>
   </div>
</template>

<script setup lang="ts">
import XSchemaNode from './x-schema-node.vue'
import type { SchemaNode } from 'src/utils/schema-tree'

withDefaults(
   defineProps<{
      nodes: SchemaNode[]
      expanded?: boolean
      expandToken?: number
   }>(),
   { expanded: true, expandToken: 0 }
)
</script>
