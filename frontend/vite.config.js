import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const allowedHosts = env.VITE_ALLOWED_HOSTS
    ?.split(',')
    .map(host => host.trim())
    .filter(Boolean) ?? []

  return {
    plugins: [
      tailwindcss(),
    ],
    server: {
      allowedHosts:['steadier-easing-provolone.ngrok-free.dev'],
      proxy: {
        '/ws': {
          target: 'ws://localhost:3000',
          ws: true
        }
      }
    }
  }
})
