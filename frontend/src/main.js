import './style.css'
import { openSubWindow, updateParticipants } from './pip/subwindow.js'
import { setupHome }from './home-screen/home.js'

setupHome(async (username) => {
  const participants = [
    {
      id: 'user-me',
      name: username,
      status: 'studying'
    }
  ]
  await openSubWindow(participants);
})

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
