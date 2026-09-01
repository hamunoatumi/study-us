import './style.css'
import { openSubWindow, updateParticipants } from './subwindow.js'

// 人数のモックデータ
  let participants = [
    {
      id: 'user-1',
      name: 'A',
      status: 'studying'
    },
    {
      id: 'user-2',
      name: 'B',
      status: 'distracted'
    },
    {
      id: 'user-3',
      name: 'C',
      status: 'away'
    }
  ]

document.querySelector('#app').innerHTML = `
  <main>
    <h1>StudyUs</h1>
    <button id="open-pip">サブウィンドウを開く</button>
    <button id="update-pip">サブウィンドウを更新</button>
  </main>
`
// PiPウィンドウの作成
document
  .querySelector('#open-pip')
  .addEventListener('click', async () => {
    await openSubWindow(participants)
  })

// サブウィンドウの更新(現在は1人目の参加者をサボりにするだけ)
document.querySelector('#update-pip').addEventListener('click', () => {
  participants[0].status = 'distracted'
  updateParticipants(participants)
})