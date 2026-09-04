import {
  FaceLandmarker,
  FilesetResolver,
  type Category,
  type NormalizedLandmark,
} from '@mediapipe/tasks-vision'
import { neutralPose, type AvatarPose, type PoseProvider } from './types'

const DEFAULT_WASM_BASE_URL =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm'
const DEFAULT_MODEL_ASSET_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'

export type FaceTrackerOptions = {
  wasmBaseUrl?: string
  modelAssetUrl?: string
  minDetectionConfidence?: number
  minPresenceConfidence?: number
  minTrackingConfidence?: number
  smoothing?: number
}

export type FaceTracker = {
  detect: PoseProvider
  destroy: () => void
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

function blendshapeScore(categories: Category[], name: string): number {
  return categories.find(category => category.categoryName === name)?.score ?? 0
}

function poseFromDetection(
  landmarks: NormalizedLandmark[],
  blendshapes: Category[],
): AvatarPose | null {
  const nose = landmarks[1]
  const leftEyeOuter = landmarks[33]
  const rightEyeOuter = landmarks[263]
  if (!nose || !leftEyeOuter || !rightEyeOuter) return null

  const roll = Math.atan2(
    rightEyeOuter.y - leftEyeOuter.y,
    rightEyeOuter.x - leftEyeOuter.x,
  )

  return {
    // カメラ映像は鏡表示されるため、画面上の移動方向と一致させる。
    faceX: clamp((nose.x - 0.5) * 2, -1, 1),
    faceY: clamp((nose.y - 0.5) * 2, -1, 1),
    rotation: clamp(roll / 0.35, -1, 1),
    eyeOpenLeft: 1 - clamp(blendshapeScore(blendshapes, 'eyeBlinkLeft'), 0, 1),
    eyeOpenRight:
      1 - clamp(blendshapeScore(blendshapes, 'eyeBlinkRight'), 0, 1),
    mouthOpen: clamp(blendshapeScore(blendshapes, 'jawOpen'), 0, 1),
  }
}

function smoothPose(
  previous: AvatarPose,
  current: AvatarPose,
  smoothing: number,
): AvatarPose {
  const currentWeight = clamp(smoothing, 0, 1)
  const previousWeight = 1 - currentWeight

  return {
    faceX: previous.faceX * previousWeight + current.faceX * currentWeight,
    faceY: previous.faceY * previousWeight + current.faceY * currentWeight,
    rotation:
      previous.rotation * previousWeight + current.rotation * currentWeight,
    eyeOpenLeft:
      previous.eyeOpenLeft * previousWeight + current.eyeOpenLeft * currentWeight,
    eyeOpenRight:
      previous.eyeOpenRight * previousWeight + current.eyeOpenRight * currentWeight,
    mouthOpen:
      previous.mouthOpen * previousWeight + current.mouthOpen * currentWeight,
  }
}

export async function createFaceTracker(
  options: FaceTrackerOptions = {},
): Promise<FaceTracker> {
  const vision = await FilesetResolver.forVisionTasks(
    options.wasmBaseUrl ?? DEFAULT_WASM_BASE_URL,
  )
  const landmarker = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: options.modelAssetUrl ?? DEFAULT_MODEL_ASSET_URL,
      delegate: 'GPU',
    },
    runningMode: 'VIDEO',
    numFaces: 1,
    minFaceDetectionConfidence: options.minDetectionConfidence ?? 0.5,
    minFacePresenceConfidence: options.minPresenceConfidence ?? 0.5,
    minTrackingConfidence: options.minTrackingConfidence ?? 0.5,
    outputFaceBlendshapes: true,
  })

  let previousPose = neutralPose
  let previousVideoTime = -1
  let destroyed = false

  return {
    detect: video => {
      if (destroyed || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        return null
      }
      if (video.currentTime === previousVideoTime) return previousPose
      previousVideoTime = video.currentTime

      const result = landmarker.detectForVideo(video, performance.now())
      const landmarks = result.faceLandmarks[0]
      if (!landmarks) return null

      const blendshapes = result.faceBlendshapes[0]?.categories ?? []
      const detectedPose = poseFromDetection(landmarks, blendshapes)
      if (!detectedPose) return null

      previousPose = smoothPose(
        previousPose,
        detectedPose,
        options.smoothing ?? 0.35,
      )
      return previousPose
    },
    destroy: () => {
      if (destroyed) return
      destroyed = true
      landmarker.close()
    },
  }
}
