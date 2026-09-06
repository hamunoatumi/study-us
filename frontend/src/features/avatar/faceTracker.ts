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

function normalizedIrisPosition(
  iris: NormalizedLandmark,
  cornerA: NormalizedLandmark,
  cornerB: NormalizedLandmark,
  upperLid: NormalizedLandmark,
  lowerLid: NormalizedLandmark,
): { x: number; y: number } {
  const eyeCenterX = (cornerA.x + cornerB.x) / 2
  const eyeCenterY = (upperLid.y + lowerLid.y) / 2
  const eyeWidth = Math.max(Math.abs(cornerA.x - cornerB.x), 0.001)
  const eyeHeight = Math.max(Math.abs(upperLid.y - lowerLid.y), 0.001)

  return {
    x: clamp(((iris.x - eyeCenterX) / eyeWidth) * 3, -1, 1),
    y: clamp(((iris.y - eyeCenterY) / eyeHeight) * 1.5, -1, 1),
  }
}

function poseFromDetection(
  landmarks: NormalizedLandmark[],
  blendshapes: Category[],
  transformationMatrix: number[],
): AvatarPose | null {
  const nose = landmarks[1]
  const leftEyeOuter = landmarks[33]
  const rightEyeOuter = landmarks[263]
  const leftIris = landmarks[468]
  const rightIris = landmarks[473]
  const leftEyeInner = landmarks[133]
  const rightEyeInner = landmarks[362]
  const leftUpperLid = landmarks[159]
  const leftLowerLid = landmarks[145]
  const rightUpperLid = landmarks[386]
  const rightLowerLid = landmarks[374]
  if (
    !nose || !leftEyeOuter || !rightEyeOuter || !leftIris || !rightIris ||
    !leftEyeInner || !rightEyeInner || !leftUpperLid || !leftLowerLid ||
    !rightUpperLid || !rightLowerLid
  ) return null

  const roll = Math.atan2(
    rightEyeOuter.y - leftEyeOuter.y,
    rightEyeOuter.x - leftEyeOuter.x,
  )
  const leftGaze = normalizedIrisPosition(
    leftIris, leftEyeOuter, leftEyeInner, leftUpperLid, leftLowerLid,
  )
  const rightGaze = normalizedIrisPosition(
    rightIris, rightEyeInner, rightEyeOuter, rightUpperLid, rightLowerLid,
  )
  const pitchRadians = Math.atan2(
    transformationMatrix[6] ?? 0,
    transformationMatrix[10] ?? 1,
  )
  const yawRadians = Math.atan2(
    transformationMatrix[2] ?? 0,
    Math.hypot(
      transformationMatrix[6] ?? 0,
      transformationMatrix[10] ?? 1,
    ),
  )

  return {
    // カメラ映像は鏡表示されるため、画面上の移動方向と一致させる。
    faceX: clamp((nose.x - 0.5) * 2, -1, 1),
    faceY: clamp((nose.y - 0.5) * 2, -1, 1),
    headYaw: clamp(yawRadians / 0.55, -1, 1),
    headPitch: clamp(pitchRadians / 0.45, -1, 1),
    rotation: clamp(roll / 0.35, -1, 1),
    eyeOpenLeft: 1 - clamp(blendshapeScore(blendshapes, 'eyeBlinkLeft'), 0, 1),
    eyeOpenRight:
      1 - clamp(blendshapeScore(blendshapes, 'eyeBlinkRight'), 0, 1),
    eyeX: -(leftGaze.x + rightGaze.x) / 2,
    eyeY: (leftGaze.y + rightGaze.y) / 2,
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
    headYaw:
      previous.headYaw * previousWeight + current.headYaw * currentWeight,
    headPitch:
      previous.headPitch * previousWeight + current.headPitch * currentWeight,
    rotation:
      previous.rotation * previousWeight + current.rotation * currentWeight,
    eyeOpenLeft:
      previous.eyeOpenLeft * previousWeight + current.eyeOpenLeft * currentWeight,
    eyeOpenRight:
      previous.eyeOpenRight * previousWeight + current.eyeOpenRight * currentWeight,
    eyeX: previous.eyeX * previousWeight + current.eyeX * currentWeight,
    eyeY: previous.eyeY * previousWeight + current.eyeY * currentWeight,
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
    outputFacialTransformationMatrixes: true,
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
      const transformationMatrix =
        result.facialTransformationMatrixes[0]?.data ?? []
      const detectedPose = poseFromDetection(
        landmarks,
        blendshapes,
        transformationMatrix,
      )
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
