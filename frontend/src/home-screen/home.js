export function setupHome(onJoin) {
  const usernameInput = document.querySelector('#username')
  const joinButton = document.querySelector('#join-button')
  const joinScreen = document.querySelector('#join-screen')
  const connectedScreen = document.querySelector('#connected-screen')
  const connectedUsername = document.querySelector('#connected-username')

  let isJoining = false

  joinButton.addEventListener('click', async () => {
    if (isJoining) return
    const username = usernameInput.value.trim()

    if (!username) {
      console.log("名前を入力してください")
      return
    }
    // 参加処理
    isJoining = true

    try {
      await onJoin(username)    // WebSocket接続とルーム参加処理を呼び出す

      // 参加中の画面に切り替え
      connectedUsername.textContent = username

      joinScreen.classList.add('hidden')
      connectedScreen.classList.remove('hidden')
      
    }catch (error) {
      console.error(error)
      isJoining = false
    } 
  })
}