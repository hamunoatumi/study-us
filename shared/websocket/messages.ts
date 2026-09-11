export const PROTOCOL_VERSION = 1 as const

export const PARTICIPANT_STATUSES = [
  'unknown',
  'studying',
  'distracted',
  'away',
] as const

export type ParticipantStatus = typeof PARTICIPANT_STATUSES[number]

export type ProtocolEnvelope<TType extends string, TPayload> = {
  v: typeof PROTOCOL_VERSION
  type: TType
  seq: number
  sentAt: number
  payload: TPayload
}

export type AvatarPosePayload = {
  faceX: number
  faceY: number
  headYaw: number
  headPitch: number
  rotation: number
  eyeOpenLeft: number
  eyeOpenRight: number
  eyeX: number
  eyeY: number
  mouthOpen: number
}

export type RoomJoinPayload = {
  username: string
  avatarId: string
}

export type ActiveTabPayload = {
  hostname: string
}

export type ActivityMonitoringPayload = {
  available: boolean
}

export type AvatarTrackingPayload = {
  faceDetected: boolean
}

export type ParticipantSnapshot = {
  userId: string
  username: string
  avatarId: string
  status: ParticipantStatus
  pose: AvatarPosePayload | null
}

export type RoomJoinMessage = ProtocolEnvelope<'room.join', RoomJoinPayload>
export type RoomLeaveMessage = ProtocolEnvelope<'room.leave', Record<string, never>>
export type ActiveTabMessage = ProtocolEnvelope<'activity.tab', ActiveTabPayload>
export type ActivityMonitoringMessage = ProtocolEnvelope<
  'activity.monitoring',
  ActivityMonitoringPayload
>
export type AvatarPoseMessage = ProtocolEnvelope<'avatar.pose', AvatarPosePayload>
export type AvatarTrackingMessage = ProtocolEnvelope<
  'avatar.tracking',
  AvatarTrackingPayload
>
export type HeartbeatMessage = ProtocolEnvelope<'heartbeat', Record<string, never>>

export type ClientToServerMessage =
  | RoomJoinMessage
  | RoomLeaveMessage
  | ActiveTabMessage
  | ActivityMonitoringMessage
  | AvatarPoseMessage
  | AvatarTrackingMessage
  | HeartbeatMessage

export type RoomSnapshotMessage = ProtocolEnvelope<
  'room.snapshot',
  {
    selfUserId: string
    participants: ParticipantSnapshot[]
  }
>

export type ParticipantJoinedMessage = ProtocolEnvelope<
  'participant.joined',
  ParticipantSnapshot
>

export type ParticipantLeftMessage = ProtocolEnvelope<
  'participant.left',
  { userId: string }
>

export type ParticipantStatusMessage = ProtocolEnvelope<
  'participant.status',
  {
    userId: string
    status: ParticipantStatus
    changedAt: number
  }
>

export type ParticipantPoseMessage = ProtocolEnvelope<
  'participant.pose',
  {
    userId: string
    pose: AvatarPosePayload
  }
>

export type ProtocolErrorMessage = ProtocolEnvelope<
  'protocol.error',
  {
    code: string
    message: string
    relatedSeq: number | null
  }
>

export type ServerToClientMessage =
  | RoomSnapshotMessage
  | ParticipantJoinedMessage
  | ParticipantLeftMessage
  | ParticipantStatusMessage
  | ParticipantPoseMessage
  | ProtocolErrorMessage
