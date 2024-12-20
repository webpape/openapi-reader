<template>
   <q-badge v-if="props.minLength != undefined || props.maxLength != undefined" outline color="purple-9" style="font-size: 12px" class="q-mx-sm text-weight-bold">
      <span v-if="props.minLength && props.minLength >= 0 && !props.maxLength">0 ... {{ props.minLength }}</span>
      <span v-else-if="!props.minLength && props.maxLength && props.maxLength >= 0">{{ '0 ... ' + props.maxLength }}</span>
      <span v-else>{{ props.minLength + ' ... ' + props.maxLength }}</span>
      <span class="q-ml-xs">characters</span>
   </q-badge>
</template>

<script setup lang="ts">
export interface XBadgeLengthProps {
   minLength?: number
   maxLength?: number
}

const props = withDefaults(defineProps<XBadgeLengthProps>(), {})
</script>
