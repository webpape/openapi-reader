import { defineStore } from 'pinia'

export const useGlobalStore = defineStore('global', {
   state: () => ({
      showDescription: false,
      showDeprecated: false,
      showProperties: false,
      showObjectNames: true,
      darkMode: false,
      textSize: 1,
      specId: 'internal',
      schemasOpen: false,
      webhooksOpen: false,
      searchOptionsOpen: false,
      searchInName: true,
      searchInDescription: false,
      samplesOpen: true,
      samplesOverlay: false,
      jsonExplorer: false
   }),
   persist: {
      storage: window.localStorage
   }
})
