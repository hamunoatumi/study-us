const MESSAGE_SOURCE = 'studyus-extension'
const APP_MESSAGE_SOURCE = 'studyus-app'
const ACTIVE_TAB_CHANGED = 'ACTIVE_TAB_CHANGED'
const EXTENSION_PING = 'STUDYUS_EXTENSION_PING'
const EXTENSION_READY = 'STUDYUS_EXTENSION_READY'

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

/**
 * StudyUs拡張機能が現在のページで動作しているか確認します。
 *
 * @param {number} timeoutMs
 * @returns {Promise<boolean>}
 */
export function checkStudyUsExtension(timeoutMs = 500) {
  return new Promise((resolve) => {
    let settled = false

    function finish(available) {
      if (settled) return
      settled = true
      clearTimeout(timerId)
      window.removeEventListener('message', handleMessage)
      resolve(available)
    }

    function handleMessage(event) {
      if (event.source !== window) return
      if (event.origin !== window.location.origin) return
      if (event.data?.source !== MESSAGE_SOURCE) return
      if (event.data?.type !== EXTENSION_READY) return

      finish(true)
    }

    const timerId = window.setTimeout(
      () => finish(false),
      Math.max(0, timeoutMs),
    )

    window.addEventListener('message', handleMessage)
    window.postMessage(
      {
        source: APP_MESSAGE_SOURCE,
        type: EXTENSION_PING,
      },
      window.location.origin,
    )
  })
}
