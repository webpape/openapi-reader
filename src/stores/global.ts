import { defineStore } from 'pinia'

export const useGlobalStore = defineStore('global', {
   state: () => ({
      showDescription: true,
      showDeprecated: false,
      showProperties: true,
      showObjectNames: true,
      showFieldObject: false,
      showXParameters: true,
      darkMode: false,
      textSize: 1,
      schemasOpen: false,
      webhooksOpen: false,
      websocketsOpen: false,
      searchOptionsOpen: false,
      searchInName: true,
      searchInDescription: false,
      searchPropertyFilters: [] as string[],
      expandRoutesOnSearch: true,
      samplesOpen: true,
      samplesOverlay: false,
      jsonExplorer: false,
      sampleEnvironment: 'prod',
      sampleRegion: 'ca-central-1'
   }),
   persist: {
      storage: window.localStorage,
      afterRestore: (ctx) => {
         // Migrate older persisted key `sampleEnvironments` (array) → `sampleEnvironment` (string)
         const st = ctx.store as { sampleEnvironments?: string[]; sampleEnvironment?: string; sampleRegion?: string }
         if (Array.isArray(st.sampleEnvironments) && st.sampleEnvironments.length) {
            if (!st.sampleEnvironment || typeof st.sampleEnvironment !== 'string') {
               st.sampleEnvironment = String(st.sampleEnvironments[0]).toLowerCase()
            }
            delete st.sampleEnvironments
         }
         if (!st.sampleRegion) {
            st.sampleRegion = 'ca-central-1'
         }
      }
   }
})
