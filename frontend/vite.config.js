import { resolve } from 'node:path'

import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const allowedHosts = env.VITE_ALLOWED_HOSTS
    ?.split(',')
    .map(host => host.trim())
    .filter(Boolean) ?? []
  const serverProxyTarget = env.SERVER_PROXY_TARGET?.trim() || 'http://localhost:3000'

  return {
    input: {
      main: resolve(import.meta.dirname, 'index.html'),
      extensionDownload: resolve(import.meta.dirname, 'extension-download.html'),
    },
    plugins: [
      tailwindcss(),
    ],
    server: {
      allowedHosts,
      proxy: {
        '/ws': {
          target: serverProxyTarget,
          ws: true
        },
        '/extension/': {
          target: serverProxyTarget
        }
      }
    }
  }
})
