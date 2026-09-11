import { STATUS_INFO } from './status.js';
import { createPipAvatar } from './pipAvatar.js';

// サブウィンドウに参加者を表示する
export function renderParticipants(participants, pipWindow) {
  const participantsElement = pipWindow.document.querySelector('#participants');
  const participantCountElement = pipWindow.document.querySelector('#participant-count');

  participantCountElement.textContent = `${participants.length}人参加`;
  participantsElement.replaceChildren();

  // 参加者が0人
  if (participants.length === 0) {
    participantsElement.className = 'flex min-h-0 flex-1 items-center justify-center p-2';
    
    const messageElement = pipWindow.document.createElement('p');
    messageElement.className = 'text-sm text-gray-400';
    messageElement.textContent = '参加者がいません';
    
    participantsElement.appendChild(messageElement);
    return;
  }

  // 参加人数に応じた画面分割
  const gridClass = participants.length === 1 ? 'grid-cols-1' : 'grid-cols-2';
  participantsElement.className = `grid min-h-0 flex-1 gap-2 p-2 ${gridClass}`;

  // 1人ずつ表示
  for (const participant of participants) {
    // status情報を取得
    const status = STATUS_INFO[participant.status] ?? {
      label: '不明',
      backgroundColor: '#f9fafb',
      stripeColor: 'rgba(156, 163, 175, 0.14)'
    };

    // 参加者カード
    const participantElement = pipWindow.document.createElement('div');
    participantElement.className = 'participant flex min-h-0 flex-col items-center justify-center overflow-hidden rounded-[18px] border border-black/5 px-1 py-1';

    // statusに応じてカード背景を変更
    participantElement.style.backgroundColor = status.backgroundColor;
    participantElement.style.backgroundImage = `
      repeating-linear-gradient(
        135deg,
        ${status.stripeColor} 0px,
        ${status.stripeColor} 10px,
        transparent 10px,
        transparent 20px
      )
    `;

    // 2Dアバター
    const avatarElement = createPipAvatar(pipWindow.document, participant.id, participant.avatarId ?? 'haru');

    // 名前
    const nameElement = pipWindow.document.createElement('div');
    nameElement.className = 'max-w-full truncate text-sm font-semibold text-gray-900';
    nameElement.textContent = participant.name;

    const statusElement = pipWindow.document.createElement('div');
    statusElement.className = 'mt-0.5 flex items-center gap-1 text-[10px] font-medium text-gray-600';
    const statusDotElement = pipWindow.document.createElement('span');
    statusDotElement.className = `h-1.5 w-1.5 rounded-full ${status.dotClass ?? 'bg-gray-400'}`;
    const statusLabelElement = pipWindow.document.createElement('span');
    statusLabelElement.textContent = status.label;
    statusElement.append(statusDotElement, statusLabelElement);

    // カードへ追加
    participantElement.appendChild(avatarElement);
    participantElement.appendChild(nameElement);
    participantElement.appendChild(statusElement);

    // PiPへ追加
    participantsElement.appendChild(participantElement);
  }
}
