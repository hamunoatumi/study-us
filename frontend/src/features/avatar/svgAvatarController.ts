import { startCamera, type StartCameraOptions } from './camera'
import { createFaceTracker, type FaceTrackerOptions } from './faceTracker'
import {
  createSvgAvatarRenderer,
  type SvgAvatarRendererOptions,
} from './svgRenderer'
import { neutralPose } from './types'

export type FaceTrackedSvgAvatarControllerOptions = {
  video: HTMLVideoElement
  svg: SVGSVGElement
  camera?: StartCameraOptions
  faceTracker?: FaceTrackerOptions
  renderer?: SvgAvatarRendererOptions
  onError?: (error: Error) => void
}

export type FaceTrackedSvgAvatarController = {
  start: () => Promise<void>
  stop: () => void
  destroy: () => void
}

export async function createFaceTrackedSvgAvatarController(
  options: FaceTrackedSvgAvatarControllerOptions,
): Promise<FaceTrackedSvgAvatarController> {
  const renderer = createSvgAvatarRenderer(options.svg, options.renderer)
  const tracker = await createFaceTracker(options.faceTracker)
  let stopCamera: (() => void) | undefined
  let animationFrame: number | undefined
  let running = false

  const renderNextFrame = async () => {
    if (!running) return
    try {
      renderer.render((await tracker.detect(options.video)) ?? neutralPose)
    } catch (error) {
      options.onError?.(error instanceof Error ? error : new Error(String(error)))
    }
    animationFrame = requestAnimationFrame(renderNextFrame)
  }

  const stop = () => {
    running = false
    if (animationFrame !== undefined) cancelAnimationFrame(animationFrame)
    animationFrame = undefined
    stopCamera?.()
    stopCamera = undefined
    renderer.render(neutralPose)
  }

  return {
    start: async () => {
      if (running) return
      const cameraSession = await startCamera(options.video, options.camera)
      stopCamera = cameraSession.stop
      running = true
      animationFrame = requestAnimationFrame(renderNextFrame)
    },
    stop,
    destroy: () => {
      stop()
      tracker.destroy()
      renderer.destroy()
    },
  }
}
