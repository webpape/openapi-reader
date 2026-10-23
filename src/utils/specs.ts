export interface SpecChoice {
   id: string
   label: string
   group: 'Local' | 'eZmax API'
   url?: string
   local?: boolean
   disabled?: boolean
   size?: number
}

export const SPECS_PAGE = 'https://github.com/eZmaxinc/eZmax-API/tree/master/specs'
const RAW_BASE = 'https://raw.githubusercontent.com/eZmaxinc/eZmax-API/master/specs/'
const MAX_SPEC_BYTES = 8 * 1024 * 1024

const FALLBACK_FILES = ['ezmax.v1.0.json', 'ezmax.v1.1.json', 'ezmax.v1.2.json', 'ezmax.v1.3.json']

export function internalSpec(): SpecChoice {
   return { id: 'internal', label: 'internal.json', group: 'Local', local: true }
}

export function formatBytes(size?: number) {
   if (!size) return ''
   if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`
   if (size >= 1024) return `${Math.round(size / 1024)} KB`
   return `${size} B`
}

export function rawSpecUrl(name: string) {
   return `${RAW_BASE}${encodeURIComponent(name)}`
}

export function specFromGithubFile(file: { name: string; download_url?: string; size?: number; type?: string }): SpecChoice | undefined {
   if (file.type && file.type !== 'file') return undefined
   if (!file.name.endsWith('.json')) return undefined
   if (/postman/i.test(file.name)) return undefined
   const tooLarge = (file.size || 0) > MAX_SPEC_BYTES
   const sizeLabel = formatBytes(file.size)
   return {
      id: file.name,
      label: `${file.name}${sizeLabel ? ` · ${sizeLabel}` : ''}${tooLarge ? ' · trop volumineux' : ''}`,
      group: 'eZmax API',
      url: file.download_url || rawSpecUrl(file.name),
      disabled: tooLarge,
      size: file.size
   }
}

export function fallbackRemoteSpecs(): SpecChoice[] {
   return FALLBACK_FILES.map((name) => specFromGithubFile({ name, download_url: rawSpecUrl(name) })).filter((spec): spec is SpecChoice => Boolean(spec))
}
