export type AvatarPose = {
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

export type AvatarAppearance = {
  skinColor: string
  hairColor: string
  shirtColor: string
  outlineColor: string
}

export type PoseProvider = (
  video: HTMLVideoElement,
) => AvatarPose | null | Promise<AvatarPose | null>

export const neutralPose: AvatarPose = {
  faceX: 0,
  faceY: 0,
  headYaw: 0,
  headPitch: 0,
  rotation: 0,
  eyeOpenLeft: 1,
  eyeOpenRight: 1,
  eyeX: 0,
  eyeY: 0,
  mouthOpen: 0,
}
