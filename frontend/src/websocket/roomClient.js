export function connectRoom() {
  return new Promise((resolve, reject) => {
    const socket =
      new WebSocket('ws://localhost:3000/ws')

    socket.addEventListener('open', () => {
      console.log('WebSocket接続成功')
      resolve(socket)
    }, { once: true })

    socket.addEventListener('error', () => {
      reject(
        new Error('WebSocket接続に失敗しました')
      )
    }, { once: true })
  })
}


export function joinRoom(
  socket,
  username
) {
  return new Promise((resolve, reject) => {

    function handleMessage(event) {
      let message

      try {
        message = JSON.parse(event.data)
      } catch {
        return
      }

      // 参加成功
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
      socket.removeEventListener(
        'message',
        handleMessage
      )
    }

    socket.addEventListener(
      'message',
      handleMessage
    )

    const message = {
      v: 1,
      type: 'room.join',
      seq: 0,
      sentAt: Date.now(),

      payload: {
        username,
        avatarId: 'haru'
      }
    }

    socket.send(
      JSON.stringify(message)
    )
  })
}