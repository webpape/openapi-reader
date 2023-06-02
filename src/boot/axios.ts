import axios, { AxiosInstance } from 'axios'

declare module '@vue/runtime-core' {
   interface ComponentCustomProperties {
      $axios: AxiosInstance
   }
}

const api = axios.create({ baseURL: 'https://ezmaxinc.github.io/eZmax-API/specs/' })

export { api }
