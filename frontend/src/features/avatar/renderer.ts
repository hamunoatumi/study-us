import type { AvatarAppearance, AvatarPose } from './types'

export type AvatarRenderer = {
  render: (pose: AvatarPose) => void
  resize: () => void
  clear: () => void
  destroy: () => void
}

export type AvatarRendererOptions = {
  width?: number
  height?: number
  appearance?: Partial<AvatarAppearance>
}

const defaultAppearance: AvatarAppearance = {
  skinColor: '#ffd6b3',
  hairColor: '#49342e',
  shirtColor: '#6967d9',
  outlineColor: '#27243b',
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

export function createAvatarRenderer(
  canvas: HTMLCanvasElement,
  options: AvatarRendererOptions = {},
): AvatarRenderer {
  const renderingContext = canvas.getContext('2d')
  if (!renderingContext) {
    throw new Error('Canvas 2Dを初期化できませんでした。')
  }
  const context: CanvasRenderingContext2D = renderingContext

  const appearance = { ...defaultAppearance, ...options.appearance }
  const fallbackWidth = options.width ?? 320
  const fallbackHeight = options.height ?? 320
  let width = fallbackWidth
  let height = fallbackHeight
  let destroyed = false

  function resize() {
    if (destroyed) return
    const rect = canvas.getBoundingClientRect()
    width = rect.width || fallbackWidth
    height = rect.height || fallbackHeight
    const pixelRatio = window.devicePixelRatio || 1
    canvas.width = Math.round(width * pixelRatio)
    canvas.height = Math.round(height * pixelRatio)
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
  }

  function clear() {
    context.clearRect(0, 0, width, height)
  }

  function render(pose: AvatarPose) {
    if (destroyed) return
    clear()

    const scale = Math.min(width, height) / 320
    const centerX = width / 2 + clamp(pose.faceX, -1, 1) * 35 * scale
    const centerY = height / 2 + clamp(pose.faceY, -1, 1) * 24 * scale

    context.save()
    context.translate(centerX, centerY)
    context.rotate(clamp(pose.rotation, -1, 1) * 0.35)
    context.scale(scale, scale)
    context.lineWidth = 5
    context.lineCap = 'round'
    context.strokeStyle = appearance.outlineColor

    context.fillStyle = appearance.shirtColor
    context.beginPath()
    context.ellipse(0, 128, 92, 65, 0, 0, Math.PI * 2)
    context.fill()
    context.stroke()

    context.fillStyle = appearance.skinColor
    context.beginPath()
    context.ellipse(0, 15, 78, 92, 0, 0, Math.PI * 2)
    context.fill()
    context.stroke()

    context.fillStyle = appearance.hairColor
    context.beginPath()
    context.arc(0, -7, 80, Math.PI, Math.PI * 2)
    context.lineTo(70, 15)
    context.quadraticCurveTo(38, -55, 0, -63)
    context.quadraticCurveTo(-38, -55, -70, 15)
    context.closePath()
    context.fill()
    context.stroke()

    const drawEye = (x: number, openness: number) => {
      const eyeHeight = Math.max(1, clamp(openness, 0, 1) * 12)
      context.fillStyle = appearance.outlineColor
      context.beginPath()
      context.ellipse(x, 11, 8, eyeHeight / 2, 0, 0, Math.PI * 2)
      context.fill()
    }

    drawEye(-29, pose.eyeOpenLeft)
    drawEye(29, pose.eyeOpenRight)

    const mouthOpen = clamp(pose.mouthOpen, 0, 1)
    context.beginPath()
    if (mouthOpen < 0.1) {
      context.moveTo(-14, 52)
      context.quadraticCurveTo(0, 60, 14, 52)
      context.stroke()
    } else {
      context.fillStyle = '#a84b55'
      context.ellipse(0, 54, 13, 5 + mouthOpen * 15, 0, 0, Math.PI * 2)
      context.fill()
      context.stroke()
    }

    context.restore()
  }

  resize()

  return {
    render,
    resize,
    clear,
    destroy: () => {
      if (destroyed) return
      clear()
      destroyed = true
    },
  }
}
