import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('.', import.meta.url))

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
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
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
         const file = path.join(root, 'specs/internal.json')
         if (!fs.existsSync(file)) return
         this.emitFile({
            type: 'asset',
            fileName: 'specs/internal.json',
            source: fs.readFileSync(file)
         })
      }
   }
}

export default defineConfig({
   plugins: [
      vue(),
      serveSpecs(),
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
