export function connectRoom() {
  const socket =
    new WebSocket('ws://localhost:3000/ws')

  socket.addEventListener('open', () => {
    console.log('WebSocket接続成功')
  })

  socket.addEventListener('message', (event) => {
    const message =
      JSON.parse(event.data)

    console.log('サーバーから受信:', message)
  })

  socket.addEventListener('close', () => {
    console.log('WebSocket接続終了')
  })

  socket.addEventListener('error', (error) => {
    console.error(
      'WebSocketエラー:',
      error
    )
  })

  return socket
}

export function joinRoom(
  socket,
  username
) {
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
}