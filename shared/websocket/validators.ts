import {
  PARTICIPANT_STATUSES,
  PROTOCOL_VERSION,
  type AvatarPosePayload,
  type ClientToServerMessage,
  type ParticipantSnapshot,
  type ParticipantStatus,
  type ServerToClientMessage,
} from './messages.js'

export type ParseResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string }

type UnknownEnvelope = {
  v: typeof PROTOCOL_VERSION
  type: string
  seq: number
  sentAt: number
  payload: Record<string, unknown>
}

const ok = <T>(value: T): ParseResult<T> => ({ ok: true, value })
const failure = <T>(error: string): ParseResult<T> => ({ ok: false, error })

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const isSafeNonNegativeInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0

const isFiniteNumberInRange = (
  value: unknown,
  min: number,
  max: number,
): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max

const isIdentifier = (value: unknown, maxLength = 64): value is string =>
  typeof value === 'string' &&
  value.length >= 1 &&
  value.length <= maxLength &&
  /^[A-Za-z0-9_-]+$/.test(value)

const isUsername = (value: unknown): value is string =>
  typeof value === 'string' &&
  value.trim().length >= 1 &&
  value.length <= 32 &&
  !/[\u0000-\u001F\u007F]/u.test(value)

const isHostname = (value: unknown): value is string =>
  typeof value === 'string' &&
  value.length <= 253 &&
  !/[\s/:]/u.test(value)

const isParticipantStatus = (value: unknown): value is ParticipantStatus =>
  typeof value === 'string' &&
  (PARTICIPANT_STATUSES as readonly string[]).includes(value)

export const isAvatarPosePayload = (value: unknown): value is AvatarPosePayload =>
  isRecord(value) &&
  isFiniteNumberInRange(value.faceX, -1, 1) &&
  isFiniteNumberInRange(value.faceY, -1, 1) &&
  isFiniteNumberInRange(value.headYaw, -1, 1) &&
  isFiniteNumberInRange(value.headPitch, -1, 1) &&
  isFiniteNumberInRange(value.rotation, -1, 1) &&
  isFiniteNumberInRange(value.eyeOpenLeft, 0, 1) &&
  isFiniteNumberInRange(value.eyeOpenRight, 0, 1) &&
  isFiniteNumberInRange(value.eyeX, -1, 1) &&
  isFiniteNumberInRange(value.eyeY, -1, 1) &&
  isFiniteNumberInRange(value.mouthOpen, 0, 1)

const isParticipantSnapshot = (value: unknown): value is ParticipantSnapshot =>
  isRecord(value) &&
  isIdentifier(value.userId) &&
  isUsername(value.username) &&
  isIdentifier(value.avatarId) &&
  isParticipantStatus(value.status) &&
  (value.pose === null || isAvatarPosePayload(value.pose))

function parseEnvelope(value: unknown): ParseResult<UnknownEnvelope> {
  if (!isRecord(value)) return failure('メッセージはオブジェクトである必要があります')
  if (value.v !== PROTOCOL_VERSION) return failure('未対応のプロトコルバージョンです')
  if (typeof value.type !== 'string') return failure('typeは文字列である必要があります')
  if (!isSafeNonNegativeInteger(value.seq)) return failure('seqは0以上の安全な整数である必要があります')
  if (!isSafeNonNegativeInteger(value.sentAt)) return failure('sentAtはUnix時刻（ミリ秒）である必要があります')
  if (!isRecord(value.payload)) return failure('payloadはオブジェクトである必要があります')

  return ok(value as UnknownEnvelope)
}

export function parseClientMessage(value: unknown): ParseResult<ClientToServerMessage> {
  const envelope = parseEnvelope(value)
  if (envelope.ok === false) return failure(envelope.error)

  const { type, payload } = envelope.value
  let valid = false

  switch (type) {
    case 'room.join':
      valid = isUsername(payload.username) &&
        isIdentifier(payload.avatarId)
      break
    case 'activity.tab':
      valid = isHostname(payload.hostname)
      break
    case 'activity.monitoring':
      valid = typeof payload.available === 'boolean'
      break
    case 'avatar.pose':
      valid = isAvatarPosePayload(payload)
      break
    case 'avatar.tracking':
      valid = typeof payload.faceDetected === 'boolean'
      break
    case 'room.leave':
    case 'heartbeat':
      valid = Object.keys(payload).length === 0
      break
    default:
      return failure(`未対応のクライアントメッセージです: ${type}`)
  }

  if (!valid) return failure(`${type}のpayloadが不正です`)
  return ok(envelope.value as ClientToServerMessage)
}

export function parseServerMessage(value: unknown): ParseResult<ServerToClientMessage> {
  const envelope = parseEnvelope(value)
  if (envelope.ok === false) return failure(envelope.error)

  const { type, payload } = envelope.value
  let valid = false

  switch (type) {
    case 'room.snapshot':
      valid = isIdentifier(payload.selfUserId) &&
        Array.isArray(payload.participants) &&
        payload.participants.length <= 100 &&
        payload.participants.every(isParticipantSnapshot)
      break
    case 'participant.joined':
      valid = isParticipantSnapshot(payload)
      break
    case 'participant.left':
      valid = isIdentifier(payload.userId)
      break
    case 'participant.status':
      valid = isIdentifier(payload.userId) &&
        isParticipantStatus(payload.status) &&
        isSafeNonNegativeInteger(payload.changedAt)
      break
    case 'participant.pose':
      valid = isIdentifier(payload.userId) && isAvatarPosePayload(payload.pose)
      break
    case 'protocol.error':
      valid = typeof payload.code === 'string' &&
        payload.code.length >= 1 && payload.code.length <= 64 &&
        typeof payload.message === 'string' && payload.message.length <= 256 &&
        (payload.relatedSeq === null || isSafeNonNegativeInteger(payload.relatedSeq))
      break
    default:
      return failure(`未対応のサーバーメッセージです: ${type}`)
  }

  if (!valid) return failure(`${type}のpayloadが不正です`)
  return ok(envelope.value as ServerToClientMessage)
}
