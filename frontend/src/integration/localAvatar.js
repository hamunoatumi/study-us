import {
  avatarPresets,
  createFaceTrackedSvgAvatarController,
} from '../features/avatar'

import {
  createAvatarPoseSender
} from './avatarPoseSync.js'


export async function startLocalAvatar(
  socket,
  video,
  svg
) {
  const haru =
    avatarPresets.find(
      preset => preset.id === 'haru'
    )

  if (!haru) {
    throw new Error(
      'アバタープリセットが見つかりません'
    )
  }

  const sendPose =
    createAvatarPoseSender(socket)

  const controller =
    await createFaceTrackedSvgAvatarController({
      video,
      svg,
      renderer: haru,

      // ここで顔追跡とWebSocketを接続
      onPose: sendPose,

      onError: error => {
        console.error(
          'アバターエラー:',
          error
        )
      },
    })

  await controller.start()

  return controller
}