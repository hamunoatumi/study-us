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
  <main class="flex h-screen flex-col overflow-hidden bg-[#f5f8fc] text-[#102749]">
    <header class="flex h-12 shrink-0 items-center bg-gradient-to-r from-[#102749] to-[#284c78] px-4 text-white shadow-sm">
      <span class="mr-2 flex h-6 w-6 items-center justify-center rounded-lg bg-white/10">
        <svg aria-hidden="true" viewBox="0 0 24 24" class="h-4 w-4 fill-none stroke-current" stroke-width="1.7">
          <path d="M4.5 5.5c2.9-.8 5.4-.2 7.5 1.5v12c-2.1-1.7-4.6-2.3-7.5-1.5v-12Zm15 0c-2.9-.8-5.4-.2-7.5 1.5v12c2.1-1.7 4.6-2.3 7.5-1.5v-12Z" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </span>
      <h1 class="text-[14px] font-semibold tracking-tight">StudyUs</h1>
    </header>

    <div class="flex h-9 shrink-0 items-center border-b border-[#dde7f2] bg-white/90 px-3">
      <div class="flex items-center gap-2.5 text-[10px] font-medium text-[#607796]">
        <span class="flex items-center gap-1"><span class="h-2 w-2 rounded-full bg-emerald-600"></span>勉強中</span>
        <span class="flex items-center gap-1"><span class="h-2 w-2 rounded-full bg-rose-600"></span>サボり</span>
        <span class="flex items-center gap-1"><span class="h-2 w-2 rounded-full bg-slate-500"></span>離席中</span>
      </div>
      <span id="participant-count" class="ml-auto text-[10px] font-medium text-[#71849f]"></span>
    </div>

    <section id="participants" class="min-h-0 flex-1 p-2.5"></section>
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
