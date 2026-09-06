const MESSAGE_SOURCE = 'studyus-extension'
const ACTIVE_TAB_CHANGED = 'ACTIVE_TAB_CHANGED'

function isTabInfo(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof value.hostname === 'string' &&
    typeof value.title === 'string' &&
    typeof value.changedAt === 'string'
  )
}

/**
 * StudyUs拡張機能からアクティブタブ情報を受け取ります。
 *
 * @param {(tabInfo: { hostname: string, title: string, changedAt: string }) => void} onReceive
 * @returns {() => void} 受信を停止する関数
 */
export function receiveStudyUsTabInfo(onReceive) {
  if (typeof onReceive !== 'function') {
    throw new TypeError('onReceiveには関数を指定してください。')
  }

  function handleMessage(event) {
    if (event.source !== window) return
    if (event.origin !== window.location.origin) return

    const message = event.data

    if (message?.source !== MESSAGE_SOURCE) return
    if (message?.type !== ACTIVE_TAB_CHANGED) return
    if (!isTabInfo(message.payload)) return

    onReceive(message.payload)
  }

  window.addEventListener('message', handleMessage)

  return function stopReceiving() {
    window.removeEventListener('message', handleMessage)
  }
}
