import './avatar-preview.css'
import { createFaceTrackedSvgAvatarController } from './features/avatar'

const video = document.querySelector<HTMLVideoElement>('#camera')
const svg = document.querySelector<SVGSVGElement>('#avatar')
const button = document.querySelector<HTMLButtonElement>('#start-camera')
const status = document.querySelector<HTMLElement>('#camera-status')

if (!video || !svg || !button || !status) {
  throw new Error('プレビュー要素を取得できませんでした。')
}

const controller = await createFaceTrackedSvgAvatarController({
  video,
  svg,
  renderer: { name: 'Mizuki' },
  onError: error => {
    console.error(error)
    status.textContent = '顔を検出できませんでした'
  },
})

button.addEventListener('click', async () => {
  button.disabled = true
  status.textContent = 'カメラを準備しています…'
  try {
    await controller.start()
    button.textContent = 'カメラ連動中'
    status.textContent = '顔・目・口の動きを反映しています'
  } catch (error) {
    console.error(error)
    button.disabled = false
    status.textContent = 'カメラを開始できませんでした。権限を確認してください'
  }
})

window.addEventListener('beforeunload', controller.destroy)
