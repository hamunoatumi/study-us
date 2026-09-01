let pipWindow = null;

// 参加者の状態(status)
    const STATUS_LABELS = {
        studying: '勉強なう',
        distracted: 'サボりなう',
        away: '離席中'
    }

export async function openSubWindow(participants) {
    if (pipWindow && !pipWindow.closed) return; 

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

    renderParticipants(participants)
}

// サブウィンドウの更新
export function updateParticipants(participants) {
  if(!pipWindow || pipWindow.closed) return;
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
    
    sannkasyayouso.innerHTML = '';

    //1人ずつ表示
    for(const participant of participants){
      // 参加者全体
      const participantElement = pipWindow.document.createElement('div');
      participantElement.className = 'participant flex flex-col items-center justify-center';

      // アバター
      const avatarElement = pipWindow.document.createElement('div');
      avatarElement.className = 'avatar text-4xl';
      avatarElement.textContent = '👤';

      // 名前
      const nameElement = pipWindow.document.createElement('div');
      nameElement.className = 'name text-lg font-bold';
      nameElement.textContent = participant.name;

      // ステータス
      const statusElement = pipWindow.document.createElement('div');
      statusElement.className = 'status';
      statusElement.textContent = STATUS_LABELS[participant.status] ?? 'statusがおかしい';

      // participantの中に入れる
      participantElement.appendChild(avatarElement);
      participantElement.appendChild(nameElement);
      participantElement.appendChild(statusElement);

      // サブウィンドウの参加者要素に追加
      sannkasyayouso.appendChild(participantElement);
    }
}

// PiPウィンドウの終了(ホーム画面のためのもの)
export function closeSubWindow() {
  if(!pipWindow) return;
  pipWindow.close();
  pipWindow = null;
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