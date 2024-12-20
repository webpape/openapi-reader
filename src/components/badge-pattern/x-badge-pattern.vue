<template>
   <q-badge v-if="props.pattern" color="pink-13" outline class="q-mx-xs text-weight-normal bg-grey-2" style="border: none; font-size: 12px">{{ props.pattern }}</q-badge>
</template>

<script setup lang="ts">
export interface XBadgePatternProps {
   pattern?: string
}

const props = withDefaults(defineProps<XBadgePatternProps>(), {})
</script>
