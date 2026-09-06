import './style.css'
import { openSubWindow, updateParticipants } from './pip/subwindow.js'
import { setupHome }from './home-screen/home.js'
import { startDistractionPipSync } from './integration/distractionPipSync.js'

setupHome(async (username) => {
  const participants = [
    {
      id: 'user-me',
      name: username,
      status: 'studying'
    }
  ]
  await openSubWindow(participants);

  startDistractionPipSync(participants, 'user-me')    // 自分の参加者IDを指定
})
