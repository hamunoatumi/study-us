let pipWindow = null;

export async function openSubWindow(participants) {
    pipWindow = await documentPictureInPicture.requestWindow({ width: 400, height: 250});

    copyStylesToPip()       // tailwindcssをpipに適応

    pipWindow.document.body.innerHTML = `
    <main class="pip-container">
        <div id="participants"></div>
    </main>
    `

    renderParticipants(participants)
}

function renderParticipants(participants) {
    // サブウィンドウのDOM要素を取得
    const sannkasyayouso = pipWindow.document.querySelector('#participants');

    const participantHtml = participants.map((participant) => {
        return `
        <div class="participant">
            <div class="avatar">👤</div>
            <div class="name">${participant.name}</div>
        </div>
        `
    }).join('')
    sannkasyayouso.innerHTML = participantHtml;
}

// サブウィンドウのスタイルをコピーする関数
function copyStylesToPip() {
  for (const styleSheet of document.styleSheets) {
    try {
      const cssText = [...styleSheet.cssRules]
        .map((rule) => rule.cssText)
        .join('')

      const style = pipWindow.document.createElement('style')
      style.textContent = cssText

      pipWindow.document.head.appendChild(style)
    } catch {
      if (!styleSheet.href) continue

      const link = pipWindow.document.createElement('link')
      link.rel = 'stylesheet'
      link.href = styleSheet.href

      pipWindow.document.head.appendChild(link)
    }
  }
}