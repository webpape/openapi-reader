import { inject, type InjectionKey, type Ref } from 'vue'
import type { SpecChoice } from 'src/utils/specs'

export interface OpenApiContext {
   document: Ref<any>
   rawText: Ref<string>
   loading: Ref<boolean>
   error: Ref<string>
   kind: Ref<'' | 'openapi' | 'postman' | 'unknown'>
   specs: Ref<SpecChoice[]>
   specId: Ref<string>
}

export const openApiKey: InjectionKey<OpenApiContext> = Symbol('openapi')

export function useOpenApi() {
   const context = inject(openApiKey)
   if (!context) throw new Error('OpenAPI context is missing')
   return context
}
