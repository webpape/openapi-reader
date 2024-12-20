<template>
   <div v-if="props.type" style="font-family: Inconsolata; font-size: 12px" class="row text-grey-7 q-ml-sm">
      <div>{{ props.type }}</div>
   </div>
</template>

<script setup lang="ts">
export interface XBadgeObjectTypeProps {
   type?: string
}

const props = withDefaults(defineProps<XBadgeObjectTypeProps>(), {})
</script>
