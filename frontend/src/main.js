import './style.css'
import { openSubWindow } from './subwindow.js'

document.querySelector('#app').innerHTML = `
  <main>
    <h1>StudyUs</h1>
    <button id="open-pip">サブウィンドウを開く</button>
  </main>
`

document
  .querySelector('#open-pip')
  .addEventListener('click', async () => {
    await openSubWindow(praticipants)
  })

  // 人数のモックデータ
  const praticipants = [
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