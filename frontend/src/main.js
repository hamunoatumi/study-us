import './style.css'
import { openSubWindow, updateParticipants } from './pip/subwindow.js'
import { setupHome }from './home-screen/home.js'
import { connectRoom, joinRoom, subscribeRoomEvents, startHeartbeat } from './websocket/roomClient.js'
import {
  startTabActivitySync
} from './integration/tabActivitySync.js'
import {
  startLocalAvatar
} from './integration/localAvatar.js'

setupHome(async (username) => {
  const socket = await connectRoom()

  // ルームに参加
  const snapshot = await joinRoom(socket, username)
  startHeartbeat(socket)
  startTabActivitySync(socket)

  const video =
  document.querySelector('#camera')

const svg =
  document.querySelector('#local-avatar')

await startLocalAvatar(
  socket,
  video,
  svg
)

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

  subscribeRoomEvents(socket, {

  // 新しい参加者
  onJoined(participant) {

    const alreadyExists =
      participants.some(
        (item) =>
          item.id === participant.userId
      )

    if (alreadyExists) return

    participants.push({
      id: participant.userId,
      name: participant.username,
      status: participant.status
    })

    updateParticipants(participants)
  },


  // 参加者が退出
  onLeft({ userId }) {

    const index =
      participants.findIndex(
        (participant) =>
          participant.id === userId
      )

    if (index === -1) return

    participants.splice(index, 1)

    updateParticipants(participants)
  },


  // status変更
  onStatus({ userId, status }) {

    const participant =
      participants.find(
        (participant) =>
          participant.id === userId
      )

    if (!participant) return

    participant.status = status

    updateParticipants(participants)
  }
})
})

