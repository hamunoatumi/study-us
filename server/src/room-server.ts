import { randomUUID } from 'node:crypto'

import { WebSocket, WebSocketServer, type RawData } from 'ws'

import {
  parseClientMessage,
  PROTOCOL_VERSION,
  type AvatarPosePayload,
  type ParticipantSnapshot,
  type ParticipantStatus,
  type ServerToClientMessage,
} from '../../shared/websocket/index.js'
import { isBannedHostname, type ServerConfig } from './config.js'

type ServerPayloadByType = {
  [Message in ServerToClientMessage as Message['type']]: Message['payload']
}

type Session = {
  socket: WebSocket
  userId: string
  joined: boolean
  username: string | null
  avatarId: string | null
  status: ParticipantStatus
  pose: AvatarPosePayload | null
  hostname: string
  faceDetected: boolean
  lastHeartbeatAt: number
  lastClientSeq: number
  nextServerSeq: number
  lastPoseBroadcastAt: number
  pendingPose: AvatarPosePayload | null
  poseBroadcastTimer: NodeJS.Timeout | null
}

const OPEN = WebSocket.OPEN
const POSE_BROADCAST_INTERVAL_MS = 1_000 / 15

export class StudyUsRoomServer {
  readonly #webSocketServer: WebSocketServer
  readonly #sessions = new Map<WebSocket, Session>()
  readonly #participants = new Set<Session>()
  readonly #config: ServerConfig
  readonly #heartbeatTimer: NodeJS.Timeout

  constructor(webSocketServer: WebSocketServer, config: ServerConfig) {
    this.#webSocketServer = webSocketServer
    this.#config = config
    this.#webSocketServer.on('connection', (socket) => this.#onConnection(socket))

    const intervalMs = Math.max(1_000, Math.floor(config.heartbeatTimeoutMs / 2))
    this.#heartbeatTimer = setInterval(() => this.#markInactiveUsersAway(), intervalMs)
    this.#heartbeatTimer.unref()
  }

  close(): void {
    clearInterval(this.#heartbeatTimer)
    for (const session of this.#sessions.values()) session.socket.close()
    this.#webSocketServer.close()
  }

  #onConnection(socket: WebSocket): void {
    const session: Session = {
      socket,
      userId: randomUUID(),
      joined: false,
      username: null,
      avatarId: null,
      status: 'studying',
      pose: null,
      hostname: '',
      faceDetected: true,
      lastHeartbeatAt: Date.now(),
      lastClientSeq: -1,
      nextServerSeq: 0,
      lastPoseBroadcastAt: 0,
      pendingPose: null,
      poseBroadcastTimer: null,
    }

    this.#sessions.set(socket, session)
    socket.on('message', (data, isBinary) => this.#onMessage(session, data, isBinary))
    socket.on('close', () => this.#removeSession(session))
    socket.on('error', (error) => console.error('WebSocket接続エラー:', error))
  }

  #onMessage(session: Session, data: RawData, isBinary: boolean): void {
    if (isBinary) {
      this.#sendError(session, 'BINARY_NOT_SUPPORTED', 'JSONテキストを送信してください', null)
      return
    }

    let value: unknown
    try {
      value = JSON.parse(data.toString()) as unknown
    } catch {
      this.#sendError(session, 'INVALID_JSON', 'JSONとして解析できません', null)
      return
    }

    const parsed = parseClientMessage(value)
    if (!parsed.ok) {
      this.#sendError(session, 'INVALID_MESSAGE', parsed.error, null)
      return
    }

    const message = parsed.value
    if (message.seq <= session.lastClientSeq) {
      this.#sendError(
        session,
        'INVALID_SEQUENCE',
        'seqは直前のメッセージより大きくする必要があります',
        message.seq,
      )
      return
    }
    session.lastClientSeq = message.seq
    session.lastHeartbeatAt = Date.now()

    if (message.type === 'room.join') {
      this.#joinRoom(session, message.payload, message.seq)
      return
    }

    if (!session.joined) {
      this.#sendError(
        session,
        'ROOM_NOT_JOINED',
        '最初にroom.joinを送信してください',
        message.seq,
      )
      return
    }

    switch (message.type) {
      case 'activity.tab':
        session.hostname = message.payload.hostname
        this.#updateStatus(session)
        break
      case 'avatar.pose':
        this.#queuePoseBroadcast(session, message.payload)
        break
      case 'avatar.tracking':
        session.faceDetected = message.payload.faceDetected
        this.#updateStatus(session)
        break
      case 'heartbeat':
        this.#updateStatus(session)
        break
      case 'room.leave':
        this.#leave(session)
        session.socket.close(1000, '退出しました')
        break
    }
  }

  #joinRoom(
    session: Session,
    payload: { username: string; avatarId: string },
    relatedSeq: number,
  ): void {
    if (session.joined) {
      this.#sendError(
        session,
        'ALREADY_JOINED',
        'すでにルームへ参加しています',
        relatedSeq,
      )
      return
    }

    if (this.#participants.size >= this.#config.maxParticipants) {
      this.#sendError(session, 'ROOM_FULL', 'ルームの参加上限に達しています', relatedSeq)
      return
    }

    const existingParticipants = [...this.#participants].map((member) =>
      this.#snapshot(member),
    )
    session.joined = true
    session.username = payload.username
    session.avatarId = payload.avatarId
    this.#participants.add(session)

    this.#send(session, 'room.snapshot', {
      selfUserId: session.userId,
      participants: existingParticipants,
    })
    this.#broadcast(
      'participant.joined',
      this.#snapshot(session),
      session,
    )
  }

  #removeSession(session: Session): void {
    this.#sessions.delete(session.socket)
    this.#leave(session)
  }

  #leave(session: Session): void {
    if (!session.joined) return

    session.joined = false
    session.pendingPose = null
    if (session.poseBroadcastTimer !== null) {
      clearTimeout(session.poseBroadcastTimer)
      session.poseBroadcastTimer = null
    }
    this.#participants.delete(session)
    this.#broadcast(
      'participant.left',
      { userId: session.userId },
      session,
    )
  }

  #queuePoseBroadcast(session: Session, pose: AvatarPosePayload): void {
    session.pose = pose
    session.pendingPose = pose

    if (session.poseBroadcastTimer !== null) return

    const elapsed = Date.now() - session.lastPoseBroadcastAt
    const delayMs = Math.max(0, Math.ceil(POSE_BROADCAST_INTERVAL_MS - elapsed))
    session.poseBroadcastTimer = setTimeout(() => {
      session.poseBroadcastTimer = null
      const pendingPose = session.pendingPose
      session.pendingPose = null
      if (!session.joined || pendingPose === null) return

      session.lastPoseBroadcastAt = Date.now()
      this.#broadcast(
        'participant.pose',
        { userId: session.userId, pose: pendingPose },
        session,
      )
    }, delayMs)
  }

  #snapshot(session: Session): ParticipantSnapshot {
    if (session.username === null || session.avatarId === null) {
      throw new Error('参加前のセッションからスナップショットは作成できません')
    }
    return {
      userId: session.userId,
      username: session.username,
      avatarId: session.avatarId,
      status: session.status,
      pose: session.pose,
    }
  }

  #updateStatus(session: Session): void {
    const nextStatus: ParticipantStatus = !session.faceDetected
      ? 'away'
      : isBannedHostname(session.hostname, this.#config.bannedHostnames)
        ? 'distracted'
        : 'studying'

    if (session.status === nextStatus || !session.joined) return
    session.status = nextStatus
    this.#broadcast('participant.status', {
      userId: session.userId,
      status: nextStatus,
      changedAt: Date.now(),
    })
  }

  #markInactiveUsersAway(): void {
    const now = Date.now()
    for (const session of this.#sessions.values()) {
      const elapsed = now - session.lastHeartbeatAt
      if (session.joined && elapsed > this.#config.disconnectTimeoutMs) {
        session.socket.terminate()
        continue
      }

      if (
        session.joined &&
        session.status !== 'away' &&
        elapsed > this.#config.heartbeatTimeoutMs
      ) {
        session.status = 'away'
        this.#broadcast('participant.status', {
          userId: session.userId,
          status: 'away',
          changedAt: now,
        })
      }
    }
  }

  #broadcast<Type extends keyof ServerPayloadByType>(
    type: Type,
    payload: ServerPayloadByType[Type],
    excludedSession?: Session,
  ): void {
    for (const member of this.#participants) {
      if (member !== excludedSession) this.#send(member, type, payload)
    }
  }

  #send<Type extends keyof ServerPayloadByType>(
    session: Session,
    type: Type,
    payload: ServerPayloadByType[Type],
  ): void {
    if (session.socket.readyState !== OPEN) return
    session.socket.send(JSON.stringify({
      v: PROTOCOL_VERSION,
      type,
      seq: session.nextServerSeq++,
      sentAt: Date.now(),
      payload,
    }))
  }

  #sendError(
    session: Session,
    code: string,
    message: string,
    relatedSeq: number | null,
  ): void {
    this.#send(session, 'protocol.error', {
      code: code.slice(0, 64),
      message: message.slice(0, 256),
      relatedSeq,
    })
  }
}
