import { renderParticipants } from './renderParticipants.js';

let pipWindow = null;


export async function openSubWindow(participants) {
    if (pipWindow && !pipWindow.closed) return; 

    if(!('documentPictureInPicture' in window)) {
      console.error('PiP APIがサポートされていません');
      return;
    }

    try {
      pipWindow = await documentPictureInPicture.requestWindow({ width: 320, height: 320});
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
  <main class="flex h-screen flex-col overflow-hidden bg-[#F5F5F7] text-gray-900">
    <header class="flex h-11 shrink-0 items-center border-b border-black/5 bg-white px-3">
      <h1 class="mr-3 text-[14px] font-semibold tracking-tight">StudyUs</h1>

      <div class="flex items-center gap-2 text-[10px] text-gray-500">
        <span class="flex items-center gap-1">
          <span class="h-1.5 w-1.5 rounded-full bg-green-500"></span>
          勉強中
        </span>
        <span class="flex items-center gap-1">
          <span class="h-1.5 w-1.5 rounded-full bg-red-500"></span>
          サボり
        </span>
        <span class="flex items-center gap-1">
          <span class="h-1.5 w-1.5 rounded-full bg-gray-400"></span>
          離席中
        </span>
      </div>

      <span id="participant-count" class="ml-auto text-[10px] text-gray-400"></span>
    </header>

    <section id="participants" class="min-h-0 flex-1 p-2"></section>
  </main>
`

    renderParticipants(participants, pipWindow);
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