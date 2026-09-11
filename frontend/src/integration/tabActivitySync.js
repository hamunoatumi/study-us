import {
  checkStudyUsExtension,
  receiveStudyUsTabInfo,
} from '../extension/receiveStudyUsTabInfo.js'

import {
  sendActiveTab,
  sendActivityMonitoring,
} from '../websocket/roomClient.js'

const EXTENSION_CHECK_INTERVAL_MS = 10_000

export function startTabActivitySync(socket, onAvailabilityChange) {
  let stopped = false
  let previousAvailability

  const stopReceiving = receiveStudyUsTabInfo((tabInfo) => {
    sendActiveTab(
      socket,
      tabInfo.hostname
    )
  })

  const checkAvailability = async () => {
    const available = await checkStudyUsExtension()
    if (stopped || available === previousAvailability) return

    previousAvailability = available
    sendActivityMonitoring(socket, available)
    onAvailabilityChange?.(available)
  }

  void checkAvailability()
  const timerId = window.setInterval(
    checkAvailability,
    EXTENSION_CHECK_INTERVAL_MS,
  )

  return function stopTabActivitySync() {
    stopped = true
    window.clearInterval(timerId)
    stopReceiving()
  }
}
