import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { IncomingMessage, ServerResponse } from 'node:http'

const root = fileURLToPath(new URL('.', import.meta.url))

/** Dev-only: browser Try panel POSTs here; server forwards to the API (avoids CORS). Not for production static hosting. */
function tryApiProxy(): Plugin {
   async function handler(req: IncomingMessage, res: ServerResponse, next: () => void) {
      if (req.method !== 'POST' || req.url?.split('?')[0] !== '/__try-proxy') return next()
      const chunks: Buffer[] = []
      for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
      const raw = Buffer.concat(chunks).toString('utf8')
      let payload: { url?: string; method?: string; headers?: Record<string, string>; body?: string }
      try {
         payload = JSON.parse(raw) as typeof payload
      } catch {
         res.statusCode = 400
         res.setHeader('Content-Type', 'text/plain; charset=utf-8')
         res.end('Invalid JSON body')
         return
      }
      const targetUrl = payload.url?.trim()
      if (!targetUrl || !/^https?:\/\//i.test(targetUrl)) {
         res.statusCode = 400
         res.setHeader('Content-Type', 'text/plain; charset=utf-8')
         res.end('Invalid or missing url (http/https only)')
         return
      }
      const method = (payload.method || 'GET').toUpperCase()
      const forwardHeaders = new Headers()
      const skip = new Set(['host', 'connection', 'content-length', 'transfer-encoding', 'keep-alive'])
      for (const [k, v] of Object.entries(payload.headers || {})) {
         if (!k || skip.has(k.toLowerCase())) continue
         forwardHeaders.set(k, v)
      }
      try {
         const upstream = await fetch(targetUrl, {
            method,
            headers: forwardHeaders,
            body: method === 'GET' || method === 'HEAD' ? undefined : payload.body
         })
         const ct = upstream.headers.get('content-type')
         if (ct) res.setHeader('Content-Type', ct)
         res.statusCode = upstream.status
         res.statusMessage = upstream.statusText
         const text = await upstream.text()
         res.end(text)
      } catch (e) {
         res.statusCode = 502
         res.setHeader('Content-Type', 'text/plain; charset=utf-8')
         res.end(e instanceof Error ? e.message : String(e))
      }
   }

   return {
      name: 'try-api-proxy',
      configureServer(server) {
         server.middlewares.use(handler as (req: IncomingMessage, res: ServerResponse, next: () => void) => void)
      },
      configurePreviewServer(server) {
         server.middlewares.use(handler as (req: IncomingMessage, res: ServerResponse, next: () => void) => void)
      }
   }
}

function serveSpecs(): Plugin {
   const handler = (req: any, res: any, next: any) => {
      const raw = req.url?.split('?')[0] || ''
      if (!raw.startsWith('/specs/')) return next()
      let rel = raw
      try {
         rel = decodeURIComponent(raw)
      } catch {
         return next()
      }
      const file = path.normalize(path.join(root, rel))
      const specsDir = path.join(root, 'specs')
      if (!file.startsWith(specsDir)) return next()
      if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return next()
      const type = file.endsWith('.md') ? 'text/markdown; charset=utf-8' : 'application/json; charset=utf-8'
      res.setHeader('Content-Type', type)
      fs.createReadStream(file).pipe(res)
   }

   return {
      name: 'serve-specs',
      configureServer(server) {
         server.middlewares.use(handler)
      },
      configurePreviewServer(server) {
         server.middlewares.use(handler)
      },
      generateBundle() {
         for (const name of ['internal.json', 'changelog.md']) {
            const file = path.join(root, 'specs', name)
            if (!fs.existsSync(file)) continue
            this.emitFile({
               type: 'asset',
               fileName: `specs/${name}`,
               source: fs.readFileSync(file)
            })
         }
      }
   }
}

export default defineConfig({
   plugins: [
      vue(),
      serveSpecs(),
      tryApiProxy(),
      VitePWA({
         registerType: 'autoUpdate',
         devOptions: {
            enabled: true,
            type: 'module',
            suppressWarnings: true
         },
         includeAssets: ['favicon.ico', 'icons/*.png', 'icons/*.svg', 'logo-dark.svg', 'logo-light.svg'],
         manifest: {
            name: 'OpenAPI Reader',
            short_name: 'OpenAPI Reader',
            description: 'Fast and responsive OpenAPI specification reader and explorer',
            theme_color: '#223449',
            background_color: '#18181b',
            display: 'standalone',
            orientation: 'any',
            start_url: '/',
            icons: [
               {
                  src: '/icons/pwa-192x192.png',
                  sizes: '192x192',
                  type: 'image/png'
               },
               {
                  src: '/icons/pwa-512x512.png',
                  sizes: '512x512',
                  type: 'image/png',
                  purpose: 'any'
               },
               {
                  src: '/icons/pwa-512x512.png',
                  sizes: '512x512',
                  type: 'image/png',
                  purpose: 'maskable'
               }
            ]
         },
         workbox: {
            maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,
            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,ttf,woff,eot}']
         }
      })
   ],
   resolve: {
      alias: {
         src: path.join(root, 'src')
      }
   },
   server: {
      port: 4123
   },
   preview: {
      port: 4123
   }
})
