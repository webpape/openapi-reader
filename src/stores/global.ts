import { defineStore } from 'pinia'

export const useGlobalStore = defineStore('global', {
   state: () => ({
      showDescription: false,
      showDeprecated: false,
      /** Globally expanded properties list (detail pages, persisted in session) */
      showProperties: false
   }),
   getters: {},
   actions: {},

   persist: {
      storage: window.sessionStorage
   }
})
