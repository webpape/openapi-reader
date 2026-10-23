import { inject, type InjectionKey } from 'vue'

export const schemaDialogKey: InjectionKey<(name: string) => void> = Symbol('schema-dialog')

export function useSchemaDialog() {
   return inject(schemaDialogKey, null)
}
