import {
  avatarPresets,
  createFaceTrackedSvgAvatarController,
} from './features/avatar'

const svg = document.querySelector('#avatar')
const video = document.querySelector('#camera')
const button = document.querySelector('#start-camera')
const status = document.querySelector('#status')
const haru = avatarPresets.find(preset => preset.id === 'haru')

if (!svg || !video || !button || !status || !haru) {
  throw new Error('アバターの初期化に必要な要素を取得できませんでした')
}

const controller = await createFaceTrackedSvgAvatarController({
  svg,
  video,
  renderer: haru,
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
    status.textContent = '顔と目線の動きをアバターへ反映しています'
  } catch (error) {
    console.error(error)
    button.disabled = false
    status.textContent = 'カメラを開始できませんでした'
  }
})

window.addEventListener('beforeunload', controller.destroy)
