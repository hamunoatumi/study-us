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
      backgroundColor: '#fff8e1',
      accentColor: '#d99a16'
    };

    // 参加者カード
    const participantElement = pipWindow.document.createElement('div');
    participantElement.className = 'participant relative flex min-h-0 flex-col items-center justify-center overflow-hidden rounded-[22px] border-2 bg-white px-1.5 py-2 shadow-[0_9px_25px_rgba(48,75,112,0.12)]';

    // statusに応じてカード背景を変更
    participantElement.style.backgroundColor = status.backgroundColor;
    participantElement.style.borderColor = status.accentColor ?? '#d99a16';
    participantElement.style.backgroundImage = 'radial-gradient(circle at 75% 12%, rgba(255, 255, 255, 0.96), transparent 34%), linear-gradient(145deg, rgba(255, 255, 255, 0.45), transparent 58%)';

    const presenceElement = pipWindow.document.createElement('span');
    presenceElement.className = 'absolute right-3 top-3 h-4 w-4 rounded-full border-2 border-white shadow-sm';
    presenceElement.style.backgroundColor = status.accentColor ?? '#94a3b8';

    // 2Dアバター
    const avatarElement = createPipAvatar(pipWindow.document, participant.id, participant.avatarId ?? 'haru');

    // 名前
    const nameElement = pipWindow.document.createElement('div');
    nameElement.className = 'max-w-full truncate text-sm font-bold text-[#102749]';
    nameElement.textContent = participant.name;

    const statusElement = pipWindow.document.createElement('div');
    statusElement.className = 'mt-1 flex items-center gap-1.5 rounded-full border border-white bg-white/90 px-2.5 py-1 text-[10px] font-bold text-[#435a78] shadow-sm';
    const statusDotElement = pipWindow.document.createElement('span');
    statusDotElement.className = `h-1.5 w-1.5 rounded-full ${status.dotClass ?? 'bg-gray-400'}`;
    const statusLabelElement = pipWindow.document.createElement('span');
    statusLabelElement.textContent = status.label;
    statusElement.append(statusDotElement, statusLabelElement);

    // カードへ追加
    participantElement.appendChild(presenceElement);
    participantElement.appendChild(avatarElement);
    participantElement.appendChild(nameElement);
    participantElement.appendChild(statusElement);

    // PiPへ追加
    participantsElement.appendChild(participantElement);
  }
}
