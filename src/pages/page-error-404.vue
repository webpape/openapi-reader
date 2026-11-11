<template>
   <main class="page-404-shell">
      <XNotFound :missing="route.fullPath" />
   </main>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import XNotFound from 'src/components/not-found/x-not-found.vue'

const route = useRoute()
</script>

<style scoped>
.page-404-shell {
   min-height: calc(100vh - 48px);
   display: flex;
   align-items: center;
   justify-content: center;
   padding: 24px 16px;
}
</style>
