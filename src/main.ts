import { createApp, watch } from 'vue'
import { createI18n } from 'vue-i18n'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import ToastService from 'primevue/toastservice'
import Tooltip from 'primevue/tooltip'
import App from './App.vue'
import router from './router'
import pinia from './stores'
import messages from './i18n'
import { useGlobalStore } from './stores/global'
import 'primeicons/primeicons.css'
import 'highlight.js/styles/github-dark.css'
import './styles/app.css'

const app = createApp(App)

app.use(pinia)

const store = useGlobalStore()
document.documentElement.classList.toggle('app-dark', store.darkMode)
watch(
   () => store.darkMode,
   (dark) => document.documentElement.classList.toggle('app-dark', dark)
)

function applyTextSize(size: number) {
   const value = size >= 0 && size <= 3 ? String(size) : '1'
   document.documentElement.dataset.textSize = value
}
applyTextSize(store.textSize)
watch(() => store.textSize, applyTextSize)

app.use(router)
app.use(
   PrimeVue,
   {
      theme: {
         preset: Aura,
         options: {
            darkModeSelector: '.app-dark'
         }
      }
   }
)
app.use(ToastService)
app.directive('tooltip', Tooltip)
app.use(
   createI18n({
      locale: 'en-US',
      legacy: false,
      messages
   })
)

app.mount('#app')
