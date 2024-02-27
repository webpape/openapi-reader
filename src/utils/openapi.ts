import { OpenAPIV3 } from 'openapi-types'

interface IAdditionnalDocument {
   'x-tagGroups': {
      name: string
      tags: string[]
   }[]
}

type TOpenapiDocument = OpenAPIV3.Document & IAdditionnalDocument

class UOpenApi {
   static findSchema(ref: string | undefined, openapiDocument: TOpenapiDocument | undefined) {
      const schemaName = typeof ref === 'string' ? ref.split('/').pop() : undefined
      if (openapiDocument) {
         if (schemaName && openapiDocument.components?.schemas && openapiDocument.components?.schemas[schemaName]) return openapiDocument.components?.schemas[schemaName]
         if (schemaName && openapiDocument.components?.parameters && openapiDocument.components?.parameters[schemaName]) return openapiDocument.components?.parameters[schemaName]
      }
      return undefined
   }

   static findRefs(object: any, openapiDocument: TOpenapiDocument | undefined, counter?: number): any {
      const tryCounter = counter || 0

      if (Array.isArray(object)) {
         // Vérifie si c'est un tableau
         const newArray = [] as any[]
         for (const item of object) {
            newArray.push(this.findRefs(item, openapiDocument)) // Applique la récursion aux éléments du tableau
         }
         return newArray
      }

      if (typeof object !== 'object' || object === null) {
         return object
      }

      if ('$ref' in object) {
         const ref = object.$ref
         const schema = this.findSchema(ref, openapiDocument)

         if (schema) {
            object.$ref = schema
            return this.findRefs(schema, openapiDocument, counter + 1)
         }
      }

         for (const key in object) {
            if (object.hasOwnProperty(key)) {
               const value = object[key]
               object[key] = this.findRefs(value, openapiDocument, tryCounter + 1)
            }
         }

         return object
      }

      return undefined
   }
}

export { UOpenApi }
