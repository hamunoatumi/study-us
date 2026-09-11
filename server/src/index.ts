import { createServer } from 'node:http'
import { existsSync } from 'node:fs'
import { loadEnvFile } from 'node:process'
import { resolve } from 'node:path'

import express from 'express'
import { WebSocketServer, type WebSocket } from 'ws'

import { isOriginAllowed, loadServerConfig } from './config.js'
import { streamExtensionPackage } from './extension-package.js'
import { StudyUsRoomServer } from './room-server.js'

const localEnvPath = resolve(process.cwd(), '.env')
if (existsSync(localEnvPath)) {
  loadEnvFile(localEnvPath)
}

const config = loadServerConfig()
const app = express()

app.get('/health', (_request, response) => {
  response.json({ status: 'ok' })
})

app.get('/extension/download', async (_request, response) => {
  try {
    await streamExtensionPackage(response, config.allowedOrigins)
  } catch (error) {
    console.error('拡張機能のZIP生成に失敗しました', error)

    if (!response.headersSent) {
      response.status(500).json({ error: 'extension_package_failed' })
    } else {
      response.destroy(error instanceof Error ? error : undefined)
    }
  }
})

const httpServer = createServer(app)
const verifyClient: WebSocket.VerifyClientCallbackSync = ({ origin }) =>
  isOriginAllowed(origin, config.allowedOrigins)
const webSocketServer = new WebSocketServer({
  server: httpServer,
  path: config.websocketPath,
  maxPayload: 64 * 1024,
  verifyClient,
})

const roomServer = new StudyUsRoomServer(webSocketServer, config)

httpServer.listen(config.port, () => {
  console.log(`StudyUs server: http://localhost:${config.port}`)
  console.log(`WebSocket: ws://localhost:${config.port}${config.websocketPath}`)
})

const shutdown = (): void => {
  roomServer.close()
  httpServer.close(() => process.exit(0))
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
