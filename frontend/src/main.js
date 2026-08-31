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
    await openSubWindow()
  })