import { resolve } from 'node:path'

import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const sharedEnv = loadEnv(mode, resolve(import.meta.dirname, '..'), '')
  const frontendEnv = loadEnv(mode, process.cwd(), '')
  const env = { ...sharedEnv, ...frontendEnv }
  const configuredAllowedHosts = env.VITE_ALLOWED_HOSTS
    ?.split(',')
    .map(host => host.trim())
    .filter(Boolean) ?? []
  const publicAppHostname = (() => {
    const origin = env.PUBLIC_APP_ORIGIN?.trim()
    if (!origin) return undefined

    try {
      return new URL(origin).hostname
    } catch {
      throw new Error(`PUBLIC_APP_ORIGINに不正なOriginがあります: ${origin}`)
    }
  })()
  const allowedHosts = [
    ...new Set([
      ...configuredAllowedHosts,
      ...(publicAppHostname ? [publicAppHostname] : []),
    ]),
  ]
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
