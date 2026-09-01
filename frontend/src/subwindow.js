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

// 
export function updateParticipants(participants) {
  if(!pipWindow) return;
  renderParticipants(participants);
}


// サブウィンドウに参加者を表示する
function renderParticipants(participants) {
    // サブウィンドウのDOM要素を取得
    const sannkasyayouso = pipWindow.document.querySelector('#participants');

    // 参加人数に応じた画面分割
    let gridClass;

    if(participants.length === 1){
      gridClass = 'grid-cols-1'
    } else if(participants.length <= 4){
      gridClass = 'grid-cols-2'
    } else {
      gridClass = 'grid-cols-3'
    }

    sannkasyayouso.className = `grid ${gridClass} h-screen`; 

    // 参加者の状態(status)
    const statusComment = {
        studying: '勉強なう',
        distracted: 'サボりなう',
        away: '離席中'
    }
    
    // 参加者のHTMLを生成してサブウィンドウに挿入
    const participantHtml = participants.map((participant) => {
        return `
        <div class="participant flex flex-col items-center justify-center">
            <div class="avatar text-4xl">👤</div>
            <div class="name">${participant.name}</div>
            <div class="status">${statusComment[participant.status]}</div>
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