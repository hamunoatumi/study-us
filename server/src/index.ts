import { createServer } from 'node:http'

import express from 'express'
import { WebSocketServer } from 'ws'

import { loadServerConfig } from './config.js'
import { StudyUsRoomServer } from './room-server.js'

const config = loadServerConfig()
const app = express()

app.get('/health', (_request, response) => {
  response.json({ status: 'ok' })
})

const httpServer = createServer(app)
const webSocketServer = new WebSocketServer({
  server: httpServer,
  path: config.websocketPath,
  maxPayload: 64 * 1024,
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
