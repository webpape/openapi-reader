export const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'query', 'head', 'options', 'trace'] as const

export type HttpMethod = (typeof HTTP_METHODS)[number]

export interface TagGroup {
   name: string
   tags: string[]
}

const COMPONENT_BUCKETS = ['schemas', 'parameters', 'responses', 'requestBodies', 'headers', 'examples', 'callbacks']

export function schemaNameFromRef(ref: string | undefined) {
   if (!ref || typeof ref !== 'string') return undefined
   const name = ref.split('/').pop()
   if (!name) return undefined
   try {
      return decodeURIComponent(name)
   } catch {
      return name
   }
}

export function findComponent(ref: string | undefined, doc: any) {
   const name = schemaNameFromRef(ref)
   if (!doc || !name || !ref) return undefined
   if (ref.includes('/definitions/')) return doc.definitions?.[name] || doc.components?.schemas?.[name]
   const bucket = ref.split('/')[2]
   if (bucket && doc.components?.[bucket]?.[name]) return doc.components[bucket][name]
   for (const key of COMPONENT_BUCKETS) {
      if (doc.components?.[key]?.[name]) return doc.components[key][name]
   }
   return doc.definitions?.[name]
}

export function resolveRefs(object: any, doc: any, seen = new WeakSet<object>(), depth = 0): any {
   if (depth > 80) return object
   if (Array.isArray(object)) return object.map((item) => resolveRefs(item, doc, seen, depth + 1))
   if (typeof object !== 'object' || object === null) return object
   if (seen.has(object)) return object
   seen.add(object)

   if (typeof object.$ref === 'string') {
      const schema = findComponent(object.$ref, doc)
      const name = schemaNameFromRef(object.$ref)
      if (schema && typeof schema === 'object') {
         if (name && !schema.$schemaName) schema.$schemaName = name
         return resolveRefs(schema, doc, seen, depth + 1)
      }
   }

   for (const key of Object.keys(object)) {
      object[key] = resolveRefs(object[key], doc, seen, depth + 1)
   }
   return object
}

export function upgradeSwagger(doc: any) {
   if (!doc?.swagger || doc.openapi) return doc
   doc.openapi = '3.0.0'
   doc.components = doc.components || {}
   doc.components.schemas = { ...(doc.definitions || {}), ...(doc.components.schemas || {}) }
   if (doc.securityDefinitions) {
      doc.components.securitySchemes = { ...doc.securityDefinitions, ...(doc.components.securitySchemes || {}) }
   }
   if (!doc.servers?.length && doc.host) {
      const scheme = doc.schemes?.[0] || 'https'
      doc.servers = [{ url: `${scheme}://${doc.host}${doc.basePath || ''}` }]
   }

   for (const item of Object.values(doc.paths || {}) as any[]) {
      for (const method of HTTP_METHODS) {
         const operation = item?.[method]
         if (!operation?.parameters) continue
         const body = operation.parameters.find((parameter: any) => parameter?.in === 'body')
         const formFields = operation.parameters.filter((parameter: any) => parameter?.in === 'formData')
         if (body) {
            operation.requestBody = {
               description: body.description,
               required: body.required,
               content: { 'application/json': { schema: body.schema } }
            }
         } else if (formFields.length) {
            const properties: Record<string, any> = {}
            const required: string[] = []
            for (const field of formFields) {
               properties[field.name] = field.schema || { type: field.type, enum: field.enum, description: field.description }
               if (field.required) required.push(field.name)
            }
            operation.requestBody = {
               required: required.length > 0,
               content: { 'multipart/form-data': { schema: { type: 'object', properties, required } } }
            }
         }
         operation.parameters = operation.parameters.filter((parameter: any) => parameter?.in !== 'body' && parameter?.in !== 'formData')
      }
   }
   return doc
}

export function prepareDocument(doc: any) {
   return upgradeSwagger(doc)
}

export function documentKind(doc: any): 'openapi' | 'postman' | 'unknown' {
   if (doc && (doc.openapi || doc.swagger) && doc.paths) return 'openapi'
   if (doc && Array.isArray(doc.item) && doc.info) return 'postman'
   return 'unknown'
}

export function tagGroupsOf(doc: any): TagGroup[] {
   const groups = doc?.['x-tagGroups']
   if (Array.isArray(groups) && groups.length) return groups
   const tags: string[] = []
   const push = (tag: string) => {
      if (tag && !tags.includes(tag)) tags.push(tag)
   }
   for (const tag of doc?.tags || []) push(tag.name)
   for (const item of Object.values(doc?.paths || {}) as any[]) {
      for (const method of HTTP_METHODS) {
         for (const tag of item?.[method]?.tags || []) push(tag)
      }
      for (const operation of Object.values(item?.additionalOperations || {}) as any[]) {
         for (const tag of operation?.tags || []) push(tag)
      }
   }
   return [{ name: 'Operations', tags }]
}

export function webhooksOf(doc: any): Record<string, any> {
   return doc?.webhooks || doc?.['x-webhooks'] || {}
}

export function formatTag(tagName: string) {
   return tagName.replace('General_', '').replace('Object_', '').replace('Global_', '').replace('Module_', '').replace('External_', '')
}

export function vendorExtensions(operation: any) {
   const flags: { key: string; label: string }[] = []
   const lists: { key: string; label: string; value: string[] }[] = []
   const texts: { key: string; label: string; value: string }[] = []

   for (const key of Object.keys(operation || {})) {
      if (!key.startsWith('x-')) continue
      const value = operation[key]
      const label = key.replace(/^x-/, '').toUpperCase()
      if (typeof value === 'boolean') {
         if (value) flags.push({ key, label })
      } else if (Array.isArray(value) && value.length) {
         lists.push({ key, label, value: value.map((item) => String(item)) })
      } else if (typeof value === 'string' && value) {
         texts.push({ key, label, value })
      }
   }

   const byLabel = (a: { label: string }, b: { label: string }) => a.label.localeCompare(b.label)
   flags.sort(byLabel)
   lists.sort(byLabel)
   texts.sort(byLabel)
   return { flags, lists, texts }
}

export function flagSeverity(label: string) {
   if (label.includes('SUPERADMIN')) return 'danger'
   if (label.includes('INTERNAL') || label.includes('DRAFT')) return 'warn'
   if (label.includes('POWERAUTOMATE')) return 'info'
   return 'secondary'
}

export const UOpenApi = {
   findSchema: findComponent,
   findSchemaName: schemaNameFromRef,
   findRefs: resolveRefs
}
