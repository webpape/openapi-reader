import { defineStore } from 'pinia'

export const useGlobalStore = defineStore('global', {
   state: () => ({
      showDescription: false,
      showDeprecated: false
   }),
   getters: {},
   actions: {},

   persist: {
      storage: window.sessionStorage
   }
})
