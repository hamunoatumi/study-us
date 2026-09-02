import { STATUS_INFO } from './status.js';

// サブウィンドウに参加者を表示する
export function renderParticipants(participants, pipWindow) {
    // サブウィンドウのDOM要素を取得
    const sannkasyayouso = pipWindow.document.querySelector('#participants');
    const participantCountElement = pipWindow.document.querySelector('#participant-count');

    participantCountElement.textContent =`${participants.length}人参加`;

    // 参加人数に応じた画面分割
    let gridClass;

    if(participants.length === 0){
        sannkasyayouso.className = 'flex min-h-0 flex-1 items-center justify-center p-3';
        const messageElement = pipWindow.document.createElement('p');

        messageElement.className = 'text-sm text-gray-400';
        messageElement.textContent = '参加者がいません';

        sannkasyayouso.appendChild(messageElement);
        return;
    }

    if(participants.length === 1){
      gridClass = 'grid-cols-1'
    } else if(participants.length <= 4){
      gridClass = 'grid-cols-2'
    } else {
      gridClass = 'grid-cols-3'
    }

    sannkasyayouso.className = `grid min-h-0 flex-1 gap-2.5 p-3 ${gridClass}`;
    
    sannkasyayouso.replaceChildren();

    //1人ずつ表示
    for(const participant of participants){
      // 参加者全体
      const participantElement = pipWindow.document.createElement('div');
      participantElement.className = 'participant flex min-h-0 flex-col items-center justify-center rounded-[18px] border border-black/5 bg-whitepx-3 py-3';

      // アバター
      const avatarElement = pipWindow.document.createElement('div');
      avatarElement.className = 'avatar mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-3xl';
      avatarElement.textContent = '👤';

      // 名前
      const nameElement = pipWindow.document.createElement('div');
      nameElement.className = 'max-w-full truncate text-sm font-medium text-gray-900';
      nameElement.textContent = participant.name;

      // ステータス
      const statusElement = pipWindow.document.createElement('div');
      statusElement.className = 'mt-1.5 flex items-center gap-1.5';

      // 丸
      const statusDot = pipWindow.document.createElement('span');
      statusDot.className =`h-1.5 w-1.5 rounded-full ${status.dotClass}`;
      // 文字
      const statusLabel = pipWindow.document.createElement('span');
      statusLabel.className = `text-[11px] font-medium ${status.textClass}`;
      statusLabel.textContent = status.label;
      statusElement.appendChild(statusDot);
      statusElement.appendChild(statusLabel);

      // participantの中に入れる
      participantElement.appendChild(avatarElement);
      participantElement.appendChild(nameElement);
      participantElement.appendChild(statusElement);

      // サブウィンドウの参加者要素に追加
      sannkasyayouso.appendChild(participantElement);
    }
}
