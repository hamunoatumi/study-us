const MESSAGE_SOURCE = 'studyus-extension'
const APP_MESSAGE_SOURCE = 'studyus-app'
const EXTENSION_PING = 'STUDYUS_EXTENSION_PING'
const EXTENSION_READY = 'STUDYUS_EXTENSION_READY'

window.addEventListener('message', event => {
  if (event.source !== window) return
  if (event.origin !== window.location.origin) return
  if (event.data?.source !== APP_MESSAGE_SOURCE) return
  if (event.data?.type !== EXTENSION_PING) return

  window.postMessage({
    source: MESSAGE_SOURCE,
    type: EXTENSION_READY,
    payload: {},
  }, window.location.origin)

  chrome.runtime.sendMessage({
    type: 'REQUEST_ACTIVE_TAB',
  }).catch(error => {
    console.error('[StudyUs Extension] Failed to request active tab.', error)
  })
})

chrome.runtime.onMessage.addListener(message => {
  if (message?.type !== 'ACTIVE_TAB_CHANGED') return

  const studyUsMessage = {
    source: MESSAGE_SOURCE,
    type: message.type,
    payload: message.payload,
  }

  console.info('[StudyUs Extension] Active tab changed:', message.payload)
  window.postMessage(studyUsMessage, window.location.origin)
})

console.info('[StudyUs Extension] Tab monitor connected.')
