import { startDistractionMonitor } from '../extension/distractionMonitor.js'    // サボり判定の結果を受け取る関数をインポート
import { updateParticipants } from '../pip/subwindow.js'    // サブウィンドウの更新関数をインポート

// サボり判定の結果をpipに反映させる関数
export function startDistractionPipSync(participants, myUserId) {
  return startDistractionMonitor((status) => {

    const me = participants.find((participant) =>
          participant.id === myUserId)
    if (!me) {
      console.error('自分の参加者情報が見つかりません')
      return
    }

    me.status = status

    updateParticipants(participants)
  })
}