import './style.css'
import { openSubWindow, updateParticipants, closeSubWindow } from './pip/subwindow.js'
import { setupHome } from './home-screen/home.js'
import { connectRoom, joinRoom, subscribeRoomEvents, startHeartbeat, leaveRoom } from './websocket/roomClient.js'
import { startTabActivitySync } from './integration/tabActivitySync.js'
import { startLocalAvatar } from './integration/localAvatar.js'
import { updatePipAvatarPose } from './pip/pipAvatar.js'
import { checkStudyUsExtension } from './extension/receiveStudyUsTabInfo.js'

let currentSocket = null  // 退出処理で使用
let currentAvatarController = null  // 退出処理(カメラ、pip)で使用
let stopCurrentTabActivitySync = null

const extensionWarning = document.querySelector('#extension-warning')
const updateExtensionWarning = (available) => {
  extensionWarning.classList.toggle('hidden', available)
}

void checkStudyUsExtension().then(updateExtensionWarning)

setupHome(

  // 参加処理
  async (username) => {
    const socket = await connectRoom()

    // ルームに参加
    const snapshot = await joinRoom(socket, username)

    // 今使っているsocketを退出処理から使えるよう保存
    currentSocket = socket

    const video = document.querySelector('#camera')
    const svg = document.querySelector('#local-avatar')


    // 自分
    const me = {
      id: snapshot.selfUserId,
      name: username,
      status: 'unknown',
      avatarId: 'haru'
    }

    // 他の参加者
    const others = snapshot.participants.map((participant) => ({
      id: participant.userId,
      name: participant.username,
      status: participant.status,
      avatarId: participant.avatarId
    }))

    // PiP用参加者一覧
    const participants = [me, ...others]

    // 状態や姿勢の送信を始める前に受信を開始する
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
          status: participant.status,
          avatarId: participant.avatarId
        })

        updateParticipants(participants)
      },


      // アバターの姿勢変更
      onPose({ userId, pose }) {
        updatePipAvatarPose(
          userId,
          pose
        )
      },


      // 参加者が退出
      onLeft({ userId }) {

        const index =
          participants.findIndex(
            (participant) =>
              participant.id === userId
          )

        if (index === -1) return

        participants.splice(
          index,
          1
        )

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

    startHeartbeat(socket)
    stopCurrentTabActivitySync = startTabActivitySync(
      socket,
      updateExtensionWarning,
    )

    // PiP表示
    await openSubWindow(participants)

    // カメラ・アバター開始
    currentAvatarController = await startLocalAvatar(
      socket,
      video,
      svg,
      (pose) => {
        updatePipAvatarPose(
          snapshot.selfUserId,
          pose
        )
      }
    )
  },


  // 退出処理
  async () => {
  if (!currentSocket) return

  // サーバーへ退出通知
  leaveRoom(currentSocket)

  // カメラ・顔追跡を停止
  currentAvatarController?.destroy()
  stopCurrentTabActivitySync?.()

  closeSubWindow()

  currentSocket = null
  currentAvatarController = null
  stopCurrentTabActivitySync = null
}

)
