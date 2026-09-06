import WebSocket from 'ws'

import {
  parseServerMessage,
  PROTOCOL_VERSION,
  type ClientToServerMessage,
  type ServerToClientMessage,
} from '../../shared/websocket/index.js'

const url = process.env.WS_URL ?? 'ws://localhost:3000/ws'

const connect = (name: string): Promise<WebSocket> =>
  new Promise((resolve, reject) => {
    const socket = new WebSocket(url)
    socket.once('open', () => {
      console.log(`[${name}] 接続しました`)
      resolve(socket)
    })
    socket.once('error', reject)
  })

const waitForMessage = <Type extends ServerToClientMessage['type']>(
  socket: WebSocket,
  type: Type,
): Promise<Extract<ServerToClientMessage, { type: Type }>> =>
  new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup()
      reject(new Error(`${type}を受信できませんでした`))
    }, 3_000)

    const onMessage = (data: WebSocket.RawData): void => {
      let value: unknown
      try {
        value = JSON.parse(data.toString()) as unknown
      } catch {
        return
      }

      const parsed = parseServerMessage(value)
      if (!parsed.ok || parsed.value.type !== type) return

      cleanup()
      console.log(`[受信] ${JSON.stringify(parsed.value, null, 2)}`)
      resolve(parsed.value as Extract<ServerToClientMessage, { type: Type }>)
    }

    const cleanup = (): void => {
      clearTimeout(timeout)
      socket.off('message', onMessage)
    }

    socket.on('message', onMessage)
  })

const send = (socket: WebSocket, message: ClientToServerMessage): void => {
  socket.send(JSON.stringify(message))
}

const envelope = <Message extends ClientToServerMessage>(
  message: Omit<Message, 'v' | 'sentAt'>,
): Message => ({
  ...message,
  v: PROTOCOL_VERSION,
  sentAt: Date.now(),
}) as Message

const run = async (): Promise<void> => {
  const observer = await connect('観測側')
  const observerSnapshot = waitForMessage(observer, 'room.snapshot')
  send(observer, envelope({
    type: 'room.join',
    seq: 0,
    payload: { username: 'Jiro', avatarId: 'ren' },
  }))
  await observerSnapshot

  const sender = await connect('送信側')
  const senderSnapshot = waitForMessage(sender, 'room.snapshot')
  const joined = waitForMessage(observer, 'participant.joined')
  send(sender, envelope({
    type: 'room.join',
    seq: 0,
    payload: { username: 'Taro', avatarId: 'haru' },
  }))
  await Promise.all([senderSnapshot, joined])

  const pose = waitForMessage(observer, 'participant.pose')
  send(sender, envelope({
    type: 'avatar.pose',
    seq: 1,
    payload: {
      faceX: 0.12,
      faceY: -0.08,
      headYaw: 0.24,
      headPitch: 0.15,
      rotation: -0.05,
      eyeOpenLeft: 0.92,
      eyeOpenRight: 0.88,
      eyeX: 0.2,
      eyeY: -0.1,
      mouthOpen: 0,
    },
  }))
  await pose

  const distracted = waitForMessage(observer, 'participant.status')
  send(sender, envelope({
    type: 'activity.tab',
    seq: 2,
    payload: { hostname: 'www.youtube.com' },
  }))
  await distracted

  const away = waitForMessage(observer, 'participant.status')
  send(sender, envelope({
    type: 'avatar.tracking',
    seq: 3,
    payload: { faceDetected: false },
  }))
  await away

  sender.close()
  observer.close()
  console.log('ブロードキャストのデモが完了しました')
}

run().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
