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

export function resolveServer(server: any) {
   let url = String(server?.url || '')
   for (const [name, variable] of Object.entries(server?.variables || {}) as [string, any][]) {
      url = url.replaceAll(`{${name}}`, variable?.default ?? '')
   }
   return url.replace(/\/$/, '')
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
