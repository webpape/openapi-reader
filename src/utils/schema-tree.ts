import { resolveRefs } from './openapi'

export interface SchemaNode {
   key: string
   label: string
   typeLabel: string
   schemaName?: string
   schemaNames?: string[]
   description: string
   required: boolean
   deprecated: boolean
   nullable: boolean
   readOnly: boolean
   writeOnly: boolean
   format?: string
   pattern?: string
   minLength?: number
   maxLength?: number
   minimum?: number
   maximum?: number
   minExclusive?: boolean
   maxExclusive?: boolean
   example?: unknown
   defaultValue?: unknown
   enumValues: unknown[]
   discriminator?: string
   recursive?: boolean
   note?: string
   children: SchemaNode[]
}

export interface FlatParameter {
   name: string
   in: string
   required: boolean
   deprecated: boolean
   description: string
   example?: unknown
   schema: any
}

export interface BodyModel {
   description: string
   required: boolean
   contentTypes: string[]
   contentType: string
   schemaName?: string
   typeLabel: string
   nodes: SchemaNode[]
   example?: unknown
   stream: boolean
}

export interface ResponseModel {
   status: string
   description: string
   schemaName?: string
   schemaNames?: string[]
   typeLabel: string
   nodes: SchemaNode[]
   contentType?: string
   others: string[]
   example?: unknown
   stream: boolean
   headers: { name: string; description: string; typeLabel: string }[]
   links: { name: string; description: string }[]
}

const PREFIX_ORDER: Record<string, number> = {
   mPayload: 0,
   a_obj: 1,
   obj: 2,
   pki: 3,
   fki: 4,
   objAudit: 5,
   objDebug: 6,
   objDebugPayload: 7
}

export function customSort(a: string, b: string) {
   const rank = (label: string) => {
      for (const prefix of Object.keys(PREFIX_ORDER)) {
         if (label.startsWith(prefix)) return PREFIX_ORDER[prefix]
      }
      return 8
   }
   const delta = rank(a) - rank(b)
   return delta === 0 ? a.localeCompare(b) : delta
}

export function mergedSchema(schema: any, seen = new Set<any>()): any {
   if (!schema || typeof schema !== 'object') return {}
   if (!schema.allOf) return schema
   if (seen.has(schema)) return {}
   seen.add(schema)

   const properties: Record<string, any> = { ...(schema.properties || {}) }
   const required = new Set<string>(schema.required || [])
   const names: string[] = []
   if (schema.$schemaName) names.push(schema.$schemaName)
   const merged: any = { ...schema }

   for (const part of schema.allOf) {
      if (!part || typeof part !== 'object') continue
      if (part.$schemaName) names.push(part.$schemaName)
      const inner = part.allOf ? mergedSchema(part, seen) : part
      if (inner.$schemaName) names.push(inner.$schemaName)
      if (inner.properties) Object.assign(properties, inner.properties)
      for (const item of inner.required || []) required.add(item)
      for (const key of ['type', 'format', 'description', 'pattern', 'example', 'minimum', 'maximum', 'minLength', 'maxLength', 'nullable', 'title']) {
         if (merged[key] === undefined && inner[key] !== undefined) merged[key] = inner[key]
      }
      if (!merged.enum && inner.enum) merged.enum = inner.enum
      if (!merged.discriminator && inner.discriminator) merged.discriminator = inner.discriminator
   }

   merged.properties = properties
   merged.required = [...required]
   merged.$schemaNames = [...new Set(names)]
   return merged
}

export function describeSchema(schema: any): { typeLabel: string; schemaName?: string; schemaNames?: string[]; format?: string; nullable: boolean } {
   if (!schema || typeof schema !== 'object') return { typeLabel: '', nullable: false }
   const merged = mergedSchema(schema)
   const rawType = merged.type ?? schema.type
   const nullable = Boolean(schema.nullable || merged.nullable || (Array.isArray(rawType) && rawType.includes('null')))
   const type = Array.isArray(rawType) ? rawType.find((item: string) => item !== 'null') : rawType

   if (type === 'array' || schema.items || merged.items) {
      const inner = describeSchema(schema.items || merged.items || {})
      return {
         typeLabel: `${inner.typeLabel || 'any'}[]`,
         schemaName: inner.schemaName,
         schemaNames: inner.schemaNames,
         format: schema.format || merged.format,
         nullable
      }
   }

   const names = [...new Set([schema.$schemaName, ...(merged.$schemaNames || [])].filter(Boolean))] as string[]
   const hasProperties = Boolean(merged.properties && Object.keys(merged.properties).length)
   if (schema.oneOf || schema.anyOf) {
      return { typeLabel: names[0] || (schema.oneOf ? 'oneOf' : 'anyOf'), schemaName: names[0], format: schema.format, nullable }
   }
   if (type === 'object' || hasProperties) {
      return {
         typeLabel: names.length ? names.join(' & ') : schema.title || merged.title || 'object',
         schemaName: names[0],
         schemaNames: names,
         format: schema.format || merged.format,
         nullable
      }
   }
   return { typeLabel: type || 'any', schemaName: undefined, format: schema.format || merged.format, nullable }
}

function blankNode(partial: Pick<SchemaNode, 'key' | 'label' | 'typeLabel'> & Partial<SchemaNode>): SchemaNode {
   return {
      description: '',
      required: false,
      deprecated: false,
      nullable: false,
      readOnly: false,
      writeOnly: false,
      enumValues: [],
      children: [],
      ...partial
   }
}

export function buildNode(label: string, schema: any, required: boolean, key: string, stack: any[] = [], depth = 0): SchemaNode {
   const merged = mergedSchema(schema)
   const info = describeSchema(schema)
   const cycle = Boolean(schema && typeof schema === 'object' && stack.includes(schema))
   const enumValues = schema?.enum || merged.enum || (schema?.const !== undefined ? [schema.const] : merged.const !== undefined ? [merged.const] : [])
   const node = blankNode({
      key,
      label,
      typeLabel: info.typeLabel,
      schemaName: info.schemaName,
      schemaNames: info.schemaNames,
      description: schema?.description || merged.description || '',
      required,
      deprecated: Boolean(schema?.deprecated),
      nullable: info.nullable,
      readOnly: Boolean(schema?.readOnly || merged.readOnly),
      writeOnly: Boolean(schema?.writeOnly || merged.writeOnly),
      format: info.format,
      pattern: schema?.pattern || merged.pattern,
      minLength: schema?.minLength ?? merged.minLength,
      maxLength: schema?.maxLength ?? merged.maxLength,
      minimum: schema?.minimum ?? schema?.exclusiveMinimum ?? merged.minimum ?? merged.exclusiveMinimum,
      maximum: schema?.maximum ?? schema?.exclusiveMaximum ?? merged.maximum ?? merged.exclusiveMaximum,
      minExclusive: schema?.exclusiveMinimum !== undefined && schema?.minimum === undefined,
      maxExclusive: schema?.exclusiveMaximum !== undefined && schema?.maximum === undefined,
      example: schema?.example !== undefined ? schema.example : merged.example,
      defaultValue: schema?.default !== undefined ? schema.default : merged.default,
      enumValues,
      discriminator: schema?.discriminator?.propertyName || merged.discriminator?.propertyName,
      recursive: cycle,
      children: []
   })

   if (cycle || depth >= 18 || !schema || typeof schema !== 'object') return node
   const next = [...stack, schema]

   if (schema.oneOf || schema.anyOf) {
      const kind = schema.oneOf ? 'oneOf' : 'anyOf'
      const variants = schema.oneOf || schema.anyOf
      node.children = variants.map((variant: any, index: number) => buildNode(variant?.$schemaName || variant?.title || `${kind} ${index + 1}`, variant, false, `${key}.${kind}${index}`, next, depth + 1))
      return node
   }

   if (schema.type === 'array' || schema.items || merged.items) {
      const items = schema.items || merged.items
      if (items) {
         const itemMerged = mergedSchema(items)
         if (itemMerged.properties && Object.keys(itemMerged.properties).length) node.children = propertyNodes(itemMerged, `${key}[]`, [...next, items], depth)
         else node.children = buildNode('items', items, false, `${key}.items`, next, depth + 1).children
      }
   } else if (merged.properties && Object.keys(merged.properties).length) {
      node.children = propertyNodes(merged, key, next, depth)
   }

   if (merged.additionalProperties && typeof merged.additionalProperties === 'object') {
      node.children = [...node.children, buildNode('additionalProperties', merged.additionalProperties, false, `${key}.additionalProperties`, next, depth + 1)]
   } else if (merged.additionalProperties === true) {
      node.children = [...node.children, blankNode({ key: `${key}.additionalProperties`, label: 'additionalProperties', typeLabel: 'any' })]
   }

   return node
}

function propertyNodes(merged: any, parentKey: string, stack: any[], depth: number) {
   const required = new Set<string>(merged.required || [])
   return Object.keys(merged.properties || {})
      .map((name) => buildNode(name, merged.properties[name], required.has(name), `${parentKey}.${name}`, stack, depth + 1))
      .sort((a, b) => customSort(a.label, b.label))
}

export function nodesForSchema(schema: any, doc: any, key = 'schema') {
   if (!schema) return []
   const resolved = resolveRefs(schema, doc)
   return buildNode('root', resolved, false, key).children
}

export function schemaMeta(schema: any, doc?: any) {
   const resolved = doc ? resolveRefs(schema, doc) : schema
   const merged = mergedSchema(resolved)
   const info = describeSchema(resolved)
   return {
      ...info,
      description: resolved?.description || merged.description || '',
      pattern: resolved?.pattern || merged.pattern,
      enumValues: resolved?.enum || merged.enum || [],
      example: resolved?.example !== undefined ? resolved.example : merged.example,
      defaultValue: resolved?.default,
      minLength: resolved?.minLength ?? merged.minLength,
      maxLength: resolved?.maxLength ?? merged.maxLength,
      minimum: resolved?.minimum ?? merged.minimum,
      maximum: resolved?.maximum ?? merged.maximum,
      required: resolved?.required || merged.required || [],
      deprecated: Boolean(resolved?.deprecated),
      readOnly: Boolean(resolved?.readOnly),
      writeOnly: Boolean(resolved?.writeOnly),
      discriminator: resolved?.discriminator?.propertyName || merged.discriminator?.propertyName,
      properties: Object.keys(merged.properties || {}).length
   }
}

export function exampleFromSchema(schema: any, stack: any[] = [], depth = 0): any {
   if (!schema || typeof schema !== 'object' || depth > 4) return undefined
   if (stack.includes(schema)) return undefined
   if (schema.example !== undefined) return schema.example
   if (schema.default !== undefined) return schema.default
   if (schema.const !== undefined) return schema.const
   if (Array.isArray(schema.enum) && schema.enum.length) return schema.enum[0]

   const type = Array.isArray(schema.type) ? schema.type.find((item: string) => item !== 'null') : schema.type
   if (type === 'array' || schema.items) {
      const item = exampleFromSchema(schema.items, [...stack, schema], depth + 1)
      return item === undefined ? [] : [item]
   }

   const merged = mergedSchema(schema)
   if (merged.properties && Object.keys(merged.properties).length && (type === 'object' || !type)) {
      const entries = Object.entries(merged.properties) as [string, any][]
      const required = new Set<string>(merged.required || [])
      const requiredEntries = entries.filter(([name]) => required.has(name))
      const used = depth === 0 ? entries.slice(0, 40) : requiredEntries.length ? requiredEntries.slice(0, 12) : entries.slice(0, 6)
      const result: Record<string, any> = {}
      for (const [name, value] of used) result[name] = exampleFromSchema(value, [...stack, schema], depth + 1)
      return result
   }

   if (type === 'integer' || type === 'number') return schema.minimum ?? merged.minimum ?? 0
   if (type === 'boolean') return true
   if (type === 'string' || !type) {
      const format = schema.format || merged.format
      if (format === 'date-time') return '2026-01-01T00:00:00Z'
      if (format === 'date') return '2026-01-01'
      if (format === 'email') return 'name@example.com'
      if (format === 'uri' || format === 'url') return 'https://example.com'
      if (format === 'uuid') return '00000000-0000-4000-8000-000000000000'
      return 'string'
   }
   return undefined
}

function firstExample(examples: any) {
   if (!examples || typeof examples !== 'object') return undefined
   const first = Object.values(examples)[0] as any
   return first?.value !== undefined ? first.value : first
}

export function pickMedia(content: any, preferred?: string) {
   if (!content || typeof content !== 'object') return undefined
   const types = Object.keys(content)
   if (!types.length) return undefined
   const contentType = preferred && content[preferred] ? preferred : types.includes('application/json') ? 'application/json' : types[0]
   const media = content[contentType] || {}
   let schema = media.schema
   let stream = false
   if (media.itemSchema) {
      stream = true
      if (!schema) schema = { type: 'array', items: media.itemSchema, description: 'Stream of items' }
   }
   const example = media.example !== undefined ? media.example : firstExample(media.examples)
   return { contentType, schema, example, stream, others: types.filter((type) => type !== contentType) }
}

export function bodyModel(body: any, doc: any, preferred?: string): BodyModel | undefined {
   if (!body) return undefined
   const resolved = resolveRefs(body, doc)
   if (!resolved?.content) return undefined
   const media = pickMedia(resolved.content, preferred)
   if (!media) return undefined
   const info = describeSchema(resolveRefs(media.schema, doc))
   return {
      description: resolved.description || '',
      required: Boolean(resolved.required),
      contentTypes: Object.keys(resolved.content),
      contentType: media.contentType,
      schemaName: info.schemaName,
      typeLabel: info.typeLabel,
      nodes: nodesForSchema(media.schema, doc, 'body'),
      example: media.example !== undefined ? media.example : exampleFromSchema(resolveRefs(media.schema, doc)),
      stream: media.stream
   }
}

function statusOrder(a: string, b: string) {
   if (a === 'default') return 1
   if (b === 'default') return -1
   return a.localeCompare(b, undefined, { numeric: true })
}

export function responseModels(responses: any, doc: any): ResponseModel[] {
   const resolved = resolveRefs(responses, doc) || {}
   return Object.keys(resolved)
      .sort(statusOrder)
      .map((status) => {
         const response = resolved[status] || {}
         const media = pickMedia(response.content)
         const resolvedSchema = media?.schema ? resolveRefs(media.schema, doc) : undefined
         const info = describeSchema(resolvedSchema)
         const headers = Object.entries(response.headers || {}).map(([name, header]: [string, any]) => ({
            name,
            description: header?.description || '',
            typeLabel: describeSchema(header?.schema || header).typeLabel
         }))
         const links = Object.entries(response.links || {}).map(([name, link]: [string, any]) => ({
            name,
            description: link?.description || link?.operationId || ''
         }))
         return {
            status,
            description: response.description || '',
            schemaName: info.schemaName,
            schemaNames: info.schemaNames,
            typeLabel: media ? info.typeLabel : '',
            nodes: nodesForSchema(media?.schema, doc, status),
            contentType: media?.contentType,
            others: media?.others || [],
            example: media?.example !== undefined ? media.example : exampleFromSchema(resolvedSchema),
            stream: Boolean(media?.stream),
            headers,
            links
         }
      })
}

export function listParameters(pathItem: any, operation: any, doc: any): FlatParameter[] {
   const combined = [...(pathItem?.parameters || []), ...(operation?.parameters || [])]
   const resolved = resolveRefs(combined, doc) || []
   const map = new Map<string, FlatParameter>()
   for (const parameter of resolved) {
      if (!parameter?.name || !parameter?.in) continue
      const schema = parameter.schema || {}
      map.set(`${parameter.in}:${parameter.name}`, {
         name: parameter.name,
         in: parameter.in,
         required: Boolean(parameter.required || parameter.in === 'path'),
         deprecated: Boolean(parameter.deprecated),
         description: parameter.description || schema.description || '',
         example: parameter.example !== undefined ? parameter.example : schema.example,
         schema
      })
   }
   return [...map.values()]
}

const PARAMETER_TITLES: Record<string, string> = {
   path: 'Path parameters',
   query: 'Query parameters',
   querystring: 'Query string',
   header: 'Header parameters',
   cookie: 'Cookie parameters'
}

export function parameterSections(parameters: FlatParameter[]) {
   return ['path', 'query', 'querystring', 'header', 'cookie']
      .map((location) => ({
         in: location,
         title: PARAMETER_TITLES[location],
         nodes: parameters
            .filter((parameter) => parameter.in === location)
            .map((parameter) => {
               const node = buildNode(parameter.name, parameter.schema, parameter.required, `${location}.${parameter.name}`)
               node.description = parameter.description || node.description
               node.deprecated = parameter.deprecated || node.deprecated
               if (node.example === undefined) node.example = parameter.example
               return node
            })
      }))
      .filter((section) => section.nodes.length)
}

export function filterNodes(nodes: SchemaNode[], needle: string, parentMatched = false): SchemaNode[] {
   if (!needle) return nodes
   const result: SchemaNode[] = []
   for (const node of nodes) {
      const labelMatch = node.label.toLowerCase().includes(needle)
      const typeMatch = node.typeLabel.toLowerCase().includes(needle) || (node.schemaName || '').toLowerCase().includes(needle)
      const descriptionMatch = (node.description || '').toLowerCase().includes(needle)
      const matchedByParent = parentMatched || labelMatch
      const matched = parentMatched || labelMatch || typeMatch || descriptionMatch
      const filteredChildren = node.children.length ? filterNodes(node.children, needle, matchedByParent) : []
      if (matched || filteredChildren.length) {
         result.push({
            ...node,
            children: matchedByParent ? node.children : filteredChildren
         })
      }
   }
   return result
}

export function callbackModels(callbacks: any, doc: any) {
   const resolved = resolveRefs(callbacks, doc) || {}
   const models: { name: string; expression: string; method: string; description: string; body?: BodyModel }[] = []
   for (const [name, callback] of Object.entries(resolved) as [string, any][]) {
      if (!callback || typeof callback !== 'object') continue
      for (const [expression, pathItem] of Object.entries(callback) as [string, any][]) {
         if (expression.startsWith('x-') || expression === '$schemaName' || !pathItem || typeof pathItem !== 'object') continue
         for (const method of ['get', 'post', 'put', 'patch', 'delete', 'query', 'head', 'options', 'trace']) {
            const operation = pathItem[method]
            if (!operation) continue
            models.push({
               name,
               expression,
               method,
               description: operation.description || operation.summary || '',
               body: bodyModel(operation.requestBody, doc)
            })
         }
      }
   }
   return models
}
