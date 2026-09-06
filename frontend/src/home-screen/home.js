export function setupHome(onJoin) {
  const usernameInput = document.querySelector('#username')
  const joinButton = document.querySelector('#join-button')

  joinButton.addEventListener('click', () => {
    const username = usernameInput.value.trim()

    if (!username) {
      console.log("名前を入力してください")
      return
    }
    onJoin(username)
  })
}