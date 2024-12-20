<template>
   <q-badge v-if="props.minimum != undefined || props.maximum != undefined" outline color="purple-8" style="font-size: 12px; border: none" class="bg-grey-2 q-mx-sm text-weight-normal">
      <span v-if="props.minimum != undefined && props.minimum >= 0 && !props.maximum">{{ '>= ' + props.minimum }}</span>
      <span v-else-if="!props.minimum && props.maximum != undefined && props.maximum >= 0">{{ '<= ' + props.maximum }}</span>
      <span v-else>{{ props.minimum + ' ... ' + props.maximum }}</span>
   </q-badge>
</template>

<script setup lang="ts">
export interface XBadgeMinimumMaximumProps {
   minimum?: number
   maximum?: number
}

const props = withDefaults(defineProps<XBadgeMinimumMaximumProps>(), {})
</script>
