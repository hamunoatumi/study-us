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
  svg,
  onPose
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

      onPose: (pose) => {
        // 相手に送る
        sendPose(pose)

        // 自分のPiPにも反映
        onPose?.(pose)
      },

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