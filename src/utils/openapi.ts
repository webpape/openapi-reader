import { OpenAPIV3 } from 'openapi-types'

interface IAdditionnalDocument {
   'x-tagGroups': {
      name: string
      tags: string[]
   }[]
}

type openapiDocument = OpenAPIV3.Document & IAdditionnalDocument

class UOpenApi {
   static findSchema(ref: string | undefined, openapiDocument: openapiDocument | undefined) {
      const schemaName = typeof ref === 'string' ? ref.split('/').pop() : undefined
      if (schemaName && openapiDocument.components?.schemas[schemaName]) return openapiDocument.components?.schemas[schemaName]
      if (schemaName && openapiDocument.components?.parameters[schemaName]) return openapiDocument.components?.parameters[schemaName]
      return undefined
   }

   static findRefs(object: any, openapiDocument: openapiDocument | undefined): any {
      if (typeof object !== 'object' || object === null) {
         return object
      }

      if ('$ref' in object) {
         const ref = object.$ref
         const schema = this.findSchema(ref, openapiDocument)
         if (schema) {
            object.$ref = schema
            return this.findRefs(schema, openapiDocument)
         }
      }

      for (const key in object) {
         if (object.hasOwnProperty(key)) {
            const value = object[key]
            object[key] = this.findRefs(value, openapiDocument)
         }
      }

      return object
   }
}

export { UOpenApi }
