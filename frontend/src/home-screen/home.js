export function setupHome(onJoin) {
  const usernameInput = document.querySelector('#username')
  const joinButton = document.querySelector('#join-button')
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
      await onJoin(username)
    }catch (error) {
      console.error(error)
      isJoining = false
    } 
  })
}