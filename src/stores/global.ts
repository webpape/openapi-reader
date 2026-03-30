import { defineStore } from 'pinia'

export const useGlobalStore = defineStore('global', {
   state: () => ({
      showDescription: false,
      showDeprecated: false,
      /** Globally expanded permissions list (detail pages, persisted in session) */
      showPermission: false
   }),
   getters: {},
   actions: {},

   persist: {
      storage: window.sessionStorage
   }
})
