import { renderParticipants } from './renderParticipants.js';

let pipWindow = null;


export async function openSubWindow(participants) {
    if (pipWindow && !pipWindow.closed) return; 

    if(!('documentPictureInPicture' in window)) {
      console.error('PiP APIがサポートされていません');
      return;
    }

    try {
      pipWindow = await documentPictureInPicture.requestWindow({ width: 400, height: 250});
    }catch (error) {
      console.error('PiPウィンドウの起動に失敗しました:', error);
      pipWindow = null;
      return;
    }

    // PiPウィンドウが閉じられたときにnullにする
    pipWindow.addEventListener('pagehide', () => {
      pipWindow = null;
    })

    copyStylesToPip()       // tailwindcssをpipに適応

    pipWindow.document.body.innerHTML = `
    <main class="pip-container">
        <div id="participants"></div>
    </main>
    `

    renderParticipants(participants, pipWindow)
}

// サブウィンドウの更新
export function updateParticipants(participants) {
  if(!pipWindow || pipWindow.closed) return;
  renderParticipants(participants, pipWindow);
}

// PiPウィンドウの終了(ホーム画面のためのもの)
export function closeSubWindow() {
  if(!pipWindow) return;
  pipWindow.close();
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