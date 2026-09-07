import './style.css'
import { openSubWindow, updateParticipants } from './pip/subwindow.js'
import { setupHome }from './home-screen/home.js'
import { connectRoom, joinRoom } from './websocket/roomClient.js'

setupHome(async (username) => {
  const socket = await connectRoom()

  // ルームに参加
  const snapshot = await joinRoom(socket, username)

  // 自分
  const me = {
    id: snapshot.selfId,
    name: username,
    status: 'studying'
  }

  // 他の参加者
  const others = snapshot.participants.map((participant) => ({
    id: participant.userId,
    name: participant.username,
    status: participant.status
  }))

  // PiP用参加者一覧
  const participants = [me, ...others]
  // PiP表示
  await openSubWindow(participants)
})
