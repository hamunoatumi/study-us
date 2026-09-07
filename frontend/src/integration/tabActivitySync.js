import {
  receiveStudyUsTabInfo
} from '../extension/receiveStudyUsTabInfo.js'

import {
  sendActiveTab
} from '../websocket/roomClient.js'


export function startTabActivitySync(socket) {
  return receiveStudyUsTabInfo((tabInfo) => {
    sendActiveTab(
      socket,
      tabInfo.hostname
    )
  })
}