import type { FlatParameter } from './schema-tree'

export interface ServerOption {
   url: string
   description?: string
   resolved: string
   variables: { name: string; description?: string; defaultValue?: string; enumValues?: string[] }[]
}

export interface SecurityOption {
   label: string
   headers: Record<string, string>
   query: Record<string, string>
}

export function serverTagGroups(server: any): string[] {
   const raw = server?.['x-tag-groups'] ?? server?.['x-tagGroups']
   if (Array.isArray(raw)) return raw.map((item) => String(item))
   if (typeof raw === 'string' && raw) return [raw]
   return []
}

export function groupNameForTag(doc: any, tag: string) {
   if (!tag) return ''
   const groups = doc?.['x-tagGroups']
   if (!Array.isArray(groups)) return ''
   return groups.find((group) => (group?.tags || []).includes(tag))?.name || ''
}

function sameServer(left: any, right: any) {
   return String(left?.url || '') === String(right?.url || '')
}

export function chooseServers(doc: any, pathItem: any, operation: any, groupName: string) {
   const routeServers = operation?.servers?.length ? operation.servers : pathItem?.servers
   if (routeServers?.length) return routeServers

   const all = doc?.servers || []
   if (!groupName) return all
   const section = all.filter((server: any) => serverTagGroups(server).some((name) => name.toLowerCase() === groupName.toLowerCase()))
   if (!section.length) return all

   const elsewhere = all.filter((server: any) => !section.includes(server))
   const duplicated = section.some((server: any) => elsewhere.some((other: any) => sameServer(server, other)))
   if (!duplicated) return section
   const extras = elsewhere.filter((other: any) => section.some((server: any) => sameServer(server, other)))
   return [...section, ...extras]
}

export function serverOptions(servers: any[] | undefined): ServerOption[] {
   return (servers || []).map((server) => ({
      url: server.url,
      description: server.description,
      resolved: resolveServer(server),
      variables: Object.entries(server.variables || {}).map(([name, variable]: [string, any]) => ({
         name,
         description: variable?.description,
         defaultValue: variable?.default,
         enumValues: variable?.enum
      }))
   }))
}

/** OpenAPI variable name used for environment (dev / qa / stg / prod / iso) in internal.json */
export const INFRA_ENV_VAR = 'sInfrastructureenvironmenttypeDescription'

/** Preferred pill order (matches product wording: dev, QA, stage, prod, iso — spec uses `stg` for stage). */
const INFRA_ENV_CANONICAL_ORDER = ['dev', 'qa', 'stg', 'prod', 'iso']

/** Collect distinct environment enum values from server definitions (spec JSON), then sort canonically. */
export function infrastructureEnvironmentValues(servers: any[] | undefined): string[] {
   const seen = new Set<string>()
   const out: string[] = []
   for (const server of servers || []) {
      const variable = server?.variables?.[INFRA_ENV_VAR]
      const list = variable?.enum
      if (!Array.isArray(list)) continue
      for (const item of list) {
         const raw = String(item)
         const key = raw.toLowerCase()
         if (!key || seen.has(key)) continue
         seen.add(key)
         out.push(raw)
      }
   }
   return sortInfrastructureEnvironments(out)
}

function sortInfrastructureEnvironments(values: string[]): string[] {
   const ordered: string[] = []
   const used = new Set<string>()
   for (const canon of INFRA_ENV_CANONICAL_ORDER) {
      const hit = values.find((v) => v.toLowerCase() === canon)
      if (hit) {
         ordered.push(hit)
         used.add(hit.toLowerCase())
      }
   }
   for (const v of values) {
      if (!used.has(v.toLowerCase())) ordered.push(v)
   }
   return ordered
}

export function resolveServer(server: any, environment?: string) {
   const selected = environment ? String(environment).toLowerCase() : ''
   let url = String(server?.url || '')
   for (const [name, variable] of Object.entries(server?.variables || {}) as [string, any][]) {
      const replacement = name === INFRA_ENV_VAR && selected ? selected : (variable?.default ?? '')
      url = url.replaceAll(`{${name}}`, replacement)
   }
   return url.replace(/\/$/, '')
}

export function serverUrlForEnvironment(server: ServerOption, environment?: string) {
   const selected = environment ? String(environment).toLowerCase() : ''
   let url = server.url
   for (const variable of server.variables) {
      const replacement = variable.name === INFRA_ENV_VAR && selected ? selected : (variable.defaultValue ?? '')
      url = url.replaceAll(`{${variable.name}}`, replacement)
   }
   return url.replace(/\/$/, '')
}

/** Pick a persisted environment that is valid for the current enum list; default prod when available. */
export function coalesceEnvironmentChoice(values: string[], current: string | undefined): string {
   if (!values.length) return ''
   let lower = (current || '').toLowerCase()
   // Legacy UI id `stage` ↔ OpenAPI enum value `stg`
   if (lower === 'stage') lower = 'stg'
   if (lower && values.some((v) => v.toLowerCase() === lower)) return values.find((v) => v.toLowerCase() === lower) || lower
   const prod = values.find((v) => v.toLowerCase() === 'prod')
   if (prod) return prod
   return values[0]
}

export function joinUrl(server: string, path: string) {
   if (!server) return path
   if (/^https?:\/\//.test(path)) return path
   return `${server.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
}

export function applyPathParams(path: string, parameters: FlatParameter[]) {
   let result = path
   for (const parameter of parameters) {
      if (parameter.in !== 'path') continue
      const raw = parameter.example !== undefined ? String(parameter.example) : `{${parameter.name}}`
      const value = raw.startsWith('{') ? raw : encodeURIComponent(raw)
      result = result.replaceAll(`{${parameter.name}}`, value)
   }
   return result
}

/** Names of `{param}` placeholders in route template, in first-seen order (deduped). */
export function pathTemplateParamNames(pathTemplate: string): string[] {
   const seen = new Set<string>()
   const out: string[] = []
   const re = /\{([^}]+)\}/g
   let m: RegExpExecArray | null
   while ((m = re.exec(pathTemplate)) !== null) {
      const n = m[1]
      if (!seen.has(n)) {
         seen.add(n)
         out.push(n)
      }
   }
   return out
}

export function defaultPathParamValues(pathTemplate: string, parameters: FlatParameter[]): Record<string, string> {
   const out: Record<string, string> = {}
   for (const name of pathTemplateParamNames(pathTemplate)) {
      const p = parameters.find((x) => x.in === 'path' && x.name === name)
      out[name] = p?.example !== undefined ? String(p.example) : ''
   }
   return out
}

/** Replace `{name}` with encoded values for building the request URL. */
export function buildPathWithParamValues(pathTemplate: string, values: Record<string, string>): string {
   let result = pathTemplate
   for (const name of pathTemplateParamNames(pathTemplate)) {
      const raw = values[name] ?? ''
      result = result.replaceAll(`{${name}}`, encodeURIComponent(raw))
   }
   return result
}

export function securityOptions(requirements: any[] | undefined, schemes: Record<string, any> | undefined): SecurityOption[] {
   if (!requirements?.length) return [{ label: 'No auth', headers: {}, query: {} }]
   return requirements.map((requirement) => {
      const keys = Object.keys(requirement || {})
      if (!keys.length) return { label: 'No auth', headers: {}, query: {} }
      const headers: Record<string, string> = {}
      const query: Record<string, string> = {}
      for (const key of keys) {
         const scheme = schemes?.[key]
         if (!scheme) continue
         if (scheme.type === 'http' && scheme.scheme === 'bearer') headers.Authorization = 'Bearer <token>'
         else if (scheme.type === 'http' && scheme.scheme === 'basic') headers.Authorization = 'Basic <credentials>'
         else if (scheme.type === 'apiKey' && scheme.in === 'header') headers[scheme.name || key] = '<apiKey>'
         else if (scheme.type === 'apiKey' && scheme.in === 'query') query[scheme.name || key] = '<apiKey>'
         else if (scheme.type === 'apiKey' && scheme.in === 'cookie') headers.Cookie = `${scheme.name || key}=<apiKey>`
      }
      return { label: keys.join(' + '), headers, query }
   })
}

export function buildCurl(input: { method: string; url: string; headers: Record<string, string>; query: Record<string, string>; body?: unknown }) {
   let full = input.url
   try {
      const parsed = new URL(input.url)
      for (const [key, value] of Object.entries(input.query)) parsed.searchParams.set(key, value)
      full = parsed.toString()
   } catch {
      const query = new URLSearchParams(input.query).toString()
      full = query ? `${input.url}${input.url.includes('?') ? '&' : '?'}${query}` : input.url
   }

   const lines = [`curl -X ${input.method.toUpperCase()} '${full}'`]
   for (const [key, value] of Object.entries(input.headers)) lines.push(`  -H '${key}: ${value}'`)
   if (input.body !== undefined) {
      lines.push(`  -H 'Content-Type: application/json'`)
      lines.push(`  --data '${JSON.stringify(input.body).replaceAll("'", `'\\''`)}'`)
   }
   return lines.join(' \\\n')
}

export function prettyJson(value: unknown) {
   if (value === undefined) return ''
   const text = JSON.stringify(value, null, 2) ?? ''
   if (text.length > 120000) return `${text.slice(0, 120000)}\n…`
   return text
}

export function operationForLlm(input: { title?: string; method: string; route: string; summary?: string; description?: string; parameters: FlatParameter[]; requestSchema?: string; requestExample?: unknown; responses: { status: string; description: string; schemaName?: string; typeLabel: string }[] }) {
   const lines = [`# ${input.method.toUpperCase()} ${input.route}`, input.title ? `API: ${input.title}` : '', input.summary || '', '', input.description || ''].filter((line, index, all) => line !== '' || all[index - 1] !== '')
   if (input.parameters.length) {
      lines.push('', '## Parameters')
      for (const parameter of input.parameters) {
         const typeLabel = parameter.schema?.type || parameter.schema?.$schemaName || ''
         lines.push(`- \`${parameter.name}\` (${parameter.in}${parameter.required ? ', required' : ''}) ${typeLabel}${parameter.description ? ` — ${parameter.description}` : ''}`)
      }
   }
   if (input.requestSchema || input.requestExample !== undefined) {
      lines.push('', '## Request')
      if (input.requestSchema) lines.push(input.requestSchema)
      if (input.requestExample !== undefined) lines.push('```json', prettyJson(input.requestExample), '```')
   }
   if (input.responses.length) {
      lines.push('', '## Responses')
      for (const response of input.responses) lines.push(`- \`${response.status}\` ${response.schemaName || response.typeLabel} — ${response.description}`)
   }
   return lines.join('\n').trim()
}
