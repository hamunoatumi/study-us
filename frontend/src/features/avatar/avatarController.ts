import {
  startCamera,
  type StartCameraOptions,
} from './camera'

import {
  createAvatarRenderer,
  type AvatarRendererOptions,
} from './renderer'

import {
  neutralPose,
  type AvatarPose,
  type PoseProvider,
} from './types'

import {
  createFaceTracker,
  type FaceTrackerOptions,
} from './faceTracker'


export type AvatarControllerOptions = {
  video: HTMLVideoElement
  canvas: HTMLCanvasElement
  camera?: StartCameraOptions
  renderer?: AvatarRendererOptions
  poseProvider?: PoseProvider

  // pose取得時に外部へ通知する
  onPose?: (pose: AvatarPose) => void

  onError?: (error: Error) => void
}


export type AvatarController = {
  start: () => Promise<void>
  stop: () => void
  resize: () => void
}


export type FaceTrackedAvatarControllerOptions = Omit<
  AvatarControllerOptions,
  'poseProvider'
> & {
  faceTracker?: FaceTrackerOptions
  onTrackingChange?: (faceDetected: boolean) => void
}


export type FaceTrackedAvatarController =
  AvatarController & {
    destroy: () => void
  }


export function createAvatarController(
  options: AvatarControllerOptions,
): AvatarController {

  const renderer =
    createAvatarRenderer(
      options.canvas,
      options.renderer
    )

  let stopCamera:
    (() => void) | undefined

  let animationFrame:
    number | undefined

  let running = false


  const reportError = (
    error: unknown
  ) => {
    const normalizedError =
      error instanceof Error
        ? error
        : new Error(String(error))

    options.onError?.(
      normalizedError
    )
  }


  const renderNextFrame =
    async () => {

      if (!running) return

      try {
        const pose =
          options.poseProvider
            ? await options.poseProvider(
                options.video
              )
            : neutralPose

        const currentPose =
          pose ?? neutralPose

        // WebSocket等へposeを渡せる
        options.onPose?.(
          currentPose
        )

        // 自分のアバターも描画
        renderer.render(
          currentPose
        )

      } catch (error) {
        reportError(error)
      }

      if (running) {
        animationFrame =
          requestAnimationFrame(
            renderNextFrame
          )
      }
    }


  const stop = () => {
    running = false

    if (
      animationFrame !== undefined
    ) {
      cancelAnimationFrame(
        animationFrame
      )
    }

    animationFrame = undefined

    stopCamera?.()
    stopCamera = undefined

    renderer.clear()
  }


  return {

    start: async () => {
      if (running) return

      try {
        const cameraSession =
          await startCamera(
            options.video,
            options.camera
          )

        stopCamera =
          cameraSession.stop

        running = true

        animationFrame =
          requestAnimationFrame(
            renderNextFrame
          )

      } catch (error) {
        stop()

        reportError(error)

        throw error
      }
    },

    stop,

    resize: renderer.resize,
  }
}


export async function
createFaceTrackedAvatarController(
  options:
    FaceTrackedAvatarControllerOptions,
): Promise<FaceTrackedAvatarController> {

  const faceTracker = await createFaceTracker({
    ...options.faceTracker,
    ...(options.onTrackingChange === undefined
      ? {}
      : { onTrackingChange: options.onTrackingChange }),
  })

  const controller =
    createAvatarController({
      ...options,

      poseProvider:
        faceTracker.detect,
    })

  return {
    ...controller,

    destroy: () => {
      controller.stop()
      faceTracker.destroy()
    },
  }
}
