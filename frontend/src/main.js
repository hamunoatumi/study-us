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
    <button id="add-button">参加者を追加</button>
    <button id="remove-button">参加者を削除</button>
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

// 参加者の追加
document.querySelector('#add-button').addEventListener('click', () => {
  participants.push({
    id: "user-4",
    name: "D",
    status: "studying"
  })
  updateParticipants(participants)
})

// 参加者削除
document.querySelector('#remove-button').addEventListener('click', () => {
  participants.pop()
  updateParticipants(participants)
})