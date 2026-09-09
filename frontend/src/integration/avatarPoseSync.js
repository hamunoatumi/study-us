import {
  sendAvatarPose
} from '../websocket/roomClient.js'


export function createAvatarPoseSender(socket) {
  let lastSentAt = 0

  return function sendPose(pose) {
    const now = performance.now()

    // 100ms未満なら送らない
    if (now - lastSentAt < 100) {
      return
    }

    lastSentAt = now

    sendAvatarPose(
      socket,
      pose
    )
  }
}