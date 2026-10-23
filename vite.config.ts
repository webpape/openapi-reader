import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
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
   plugins: [vue(), serveSpecs()],
   resolve: {
      alias: {
         src: path.join(root, 'src')
      }
   },
   server: {
      port: 5173
   }
})
