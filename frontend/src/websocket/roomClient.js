const nextSeqBySocket = new WeakMap()
const websocketUrl =
  import.meta.env.VITE_WEBSOCKET_URL?.trim() ||
  'ws://localhost:3000/ws'


// WebSocketサーバーへ接続
export function connectRoom() {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(websocketUrl)

    // このsocketの送信seqを0から開始
    nextSeqBySocket.set(socket, 0)

    socket.addEventListener(
      'open',
      () => {
        console.log('WebSocket接続成功')
        resolve(socket)
      },
      { once: true }
    )

    socket.addEventListener(
      'error',
      () => {
        reject(
          new Error('WebSocket接続に失敗しました')
        )
      },
      { once: true }
    )
  })
}


// ルームへ参加
export function joinRoom(socket, username, avatarId) {
  return new Promise((resolve, reject) => {

    function handleMessage(event) {
      let message

      try {
        message = JSON.parse(event.data)
      } catch {
        return
      }

      // room.join成功
      if (message.type === 'room.snapshot') {
        cleanup()

        resolve(message.payload)
        return
      }

      // サーバーからエラー
      if (message.type === 'protocol.error') {
        cleanup()

        reject(
          new Error(message.payload.message)
        )
      }
    }

    function cleanup() {
      socket.removeEventListener('message', handleMessage)
    }

    socket.addEventListener('message', handleMessage)

    // room.joinを送信
    sendClientMessage(
      socket,
      'room.join',
      {
        username,
        avatarId
      }
    )
  })
}


// ルーム内のリアルタイムイベントを受信
export function subscribeRoomEvents(
  socket,
  handlers
) {
  function handleMessage(event) {
    let message

    try {
      message = JSON.parse(event.data)
    } catch {
      return
    }

    switch (message.type) {

      case 'participant.joined':
        handlers.onJoined?.(
          message.payload
        )
        break

      case 'participant.left':
        handlers.onLeft?.(
          message.payload
        )
        break

      case 'participant.status':
        handlers.onStatus?.(
          message.payload
        )
        break

      case 'participant.pose':
        handlers.onPose?.(
          message.payload
        )
        break
    }
  }

  socket.addEventListener(
    'message',
    handleMessage
  )

  return function unsubscribe() {
    socket.removeEventListener(
      'message',
      handleMessage
    )
  }
}


// Heartbeatを開始
export function startHeartbeat(socket) {
  const timerId = setInterval(() => {

    // WebSocket接続中でなければ送らない
    if (
      socket.readyState !== WebSocket.OPEN
    ) {
      return
    }

    sendClientMessage(socket, 'heartbeat', {} )}, 10_000)

  // Heartbeat停止
  function stopHeartbeat() {
    clearInterval(timerId)
  }

  // WebSocketが閉じたらHeartbeatも停止
  socket.addEventListener(
    'close',
    stopHeartbeat,
    { once: true }
  )

  return stopHeartbeat
}


// サーバーへメッセージを送る共通関数
function sendClientMessage(
  socket,
  type,
  payload
) {
  // 現在のseqを取得
  const seq =
    nextSeqBySocket.get(socket) ?? 0

  // 次回用に+1
  nextSeqBySocket.set(
    socket,
    seq + 1
  )

  const message = {
    v: 1,
    type,
    seq,
    sentAt: Date.now(),
    payload
  }

  socket.send(
    JSON.stringify(message)
  )
}

export function sendActiveTab(
  socket,
  hostname
) {
  if (socket.readyState !== WebSocket.OPEN) {
    return
  }

  sendClientMessage(
    socket,
    'activity.tab',
    {
      hostname
    }
  )
}

export function sendAvatarPose(
  socket,
  pose
) {
  if (
    socket.readyState !== WebSocket.OPEN
  ) {
    return
  }

  sendClientMessage(
    socket,
    'avatar.pose',
    pose
  )
}

// ルームから(フロントから)退出
export function leaveRoom(socket) {
  if (
    socket.readyState !== WebSocket.OPEN
  ) {
    return
  }

  sendClientMessage(
    socket,
    'room.leave',
    {}
  )
}
