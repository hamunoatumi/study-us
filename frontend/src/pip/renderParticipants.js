import { STATUS_INFO } from './status.js';

// サブウィンドウに参加者を表示する
export function renderParticipants(participants, pipWindow) {
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
      statusElement.textContent = STATUS_INFO[participant.status]?.label ?? 'statusがおかしい';

      // participantの中に入れる
      participantElement.appendChild(avatarElement);
      participantElement.appendChild(nameElement);
      participantElement.appendChild(statusElement);

      // サブウィンドウの参加者要素に追加
      sannkasyayouso.appendChild(participantElement);
    }
}
