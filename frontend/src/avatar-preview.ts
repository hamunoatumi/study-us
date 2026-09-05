import './avatar-preview.css'
import { avatarPresets, createFaceTracker, createSvgAvatarRenderer, neutralPose, startCamera } from './features/avatar'

const video = document.querySelector<HTMLVideoElement>('#camera')
const gallery = document.querySelector<HTMLElement>('#avatar-gallery')
const button = document.querySelector<HTMLButtonElement>('#start-camera')
const status = document.querySelector<HTMLElement>('#camera-status')
if (!video || !gallery || !button || !status) throw new Error('プレビュー要素を取得できませんでした。')

const renderers = avatarPresets.map(preset => {
  const card = document.createElement('article')
  card.className = 'avatar-card'
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.classList.add('avatar')
  card.appendChild(svg)
  gallery.insertBefore(card, video)
  const renderer = createSvgAvatarRenderer(svg, preset)
  renderer.render(neutralPose)
  return renderer
})

const tracker = await createFaceTracker()
let stopCamera: (() => void) | undefined
let animationFrame: number | undefined
const renderNextFrame = async () => {
  const pose = (await tracker.detect(video)) ?? neutralPose
  renderers.forEach(renderer => renderer.render(pose))
  animationFrame = requestAnimationFrame(renderNextFrame)
}

button.addEventListener('click', async () => {
  button.disabled = true
  status.textContent = 'カメラを準備しています…'
  try {
    const camera = await startCamera(video)
    stopCamera = camera.stop
    button.textContent = 'カメラ連動中'
    status.textContent = '4人へ同じ顔・目線の動きを反映しています'
    animationFrame = requestAnimationFrame(renderNextFrame)
  } catch (error) {
    console.error(error)
    button.disabled = false
    status.textContent = 'カメラを開始できませんでした。権限を確認してください'
  }
})

window.addEventListener('beforeunload', () => {
  if (animationFrame !== undefined) cancelAnimationFrame(animationFrame)
  stopCamera?.()
  tracker.destroy()
  renderers.forEach(renderer => renderer.destroy())
})
