import { HTTP_METHODS, formatTag, tagGroupsOf, webhooksOf } from './openapi'

export interface NavOperation {
   method: string
   route: string
   operationId: string
   summary: string
   deprecated: boolean
   searchName: string
   searchDescription: string
   order: number
}

export interface NavWebhook {
   name: string
   method: string
   summary: string
   deprecated: boolean
   searchDescription: string
}

const METHOD_ORDER = ['post', 'get', 'put', 'patch', 'delete', 'query', 'head', 'options', 'trace']

export function buildNav(doc: any) {
   const byTag: Record<string, NavOperation[]> = {}
   let order = 0

   const add = (route: string, method: string, operation: any, pathItem: any) => {
      if (!operation) return
      const tags: string[] = operation.tags?.length ? operation.tags : ['default']
      const entry: NavOperation = {
         method,
         route,
         operationId: operation.operationId || '',
         summary: operation.summary || operation.operationId || route,
         deprecated: Boolean(operation.deprecated),
         searchName: [operation.summary, operation.operationId, route, method].filter(Boolean).join('\n').toLowerCase(),
         searchDescription: String(operation.description || '').toLowerCase(),
         order: order++
      }
      for (const tag of tags) {
         byTag[tag] = byTag[tag] || []
         byTag[tag].push(entry)
      }
   }

   for (const [route, item] of Object.entries(doc?.paths || {}) as [string, any][]) {
      for (const method of HTTP_METHODS) add(route, method, item?.[method], item)
      for (const [method, operation] of Object.entries(item?.additionalOperations || {}) as [string, any][]) add(route, method, operation, item)
   }

   for (const operations of Object.values(byTag)) {
      operations.sort((a, b) => {
         const methodOrder = METHOD_ORDER.indexOf(a.method) - METHOD_ORDER.indexOf(b.method)
         return methodOrder === 0 ? a.order - b.order : methodOrder
      })
   }

   const webhooks: NavWebhook[] = Object.entries(webhooksOf(doc)).map(([name, item]) => {
      const method = HTTP_METHODS.find((candidate) => item?.[candidate]) || 'post'
      const operation = item?.[method] || {}
      return {
         name,
         method,
         summary: operation.summary || name,
         deprecated: Boolean(operation.deprecated),
         searchDescription: String(operation.description || '').toLowerCase()
      }
   })

   const schemas = Object.keys(doc?.components?.schemas || doc?.definitions || {}).sort((a, b) => a.localeCompare(b))
   return { groups: tagGroupsOf(doc), byTag, webhooks, schemas, formatTag }
}

export function findOperation(doc: any, operationId: string) {
   for (const [route, item] of Object.entries(doc?.paths || {}) as [string, any][]) {
      for (const method of HTTP_METHODS) {
         const operation = item?.[method]
         if (operation?.operationId === operationId) return { method, route, operation, pathItem: item, webhook: false }
      }
      for (const [method, operation] of Object.entries(item?.additionalOperations || {}) as [string, any][]) {
         if ((operation as any)?.operationId === operationId) return { method, route, operation, pathItem: item, webhook: false }
      }
   }
   return undefined
}

export function findWebhook(doc: any, name: string) {
   const item = webhooksOf(doc)[name]
   if (!item) return undefined
   const method = HTTP_METHODS.find((candidate) => item[candidate]) || 'post'
   if (!item[method]) return undefined
   return { method, route: name, operation: item[method], pathItem: item, webhook: true }
}

export function operationCount(doc: any) {
   let count = 0
   for (const item of Object.values(doc?.paths || {}) as any[]) {
      for (const method of HTTP_METHODS) if (item?.[method]) count += 1
      count += Object.keys(item?.additionalOperations || {}).length
   }
   return count
}
