const MESSAGE_SOURCE = 'studyus-extension'
const APP_MESSAGE_SOURCE = 'studyus-app'
const EXTENSION_PING = 'STUDYUS_EXTENSION_PING'
const EXTENSION_READY = 'STUDYUS_EXTENSION_READY'
const ACTIVE_TAB_RESULT = 'ACTIVE_TAB_RESULT'

function postActiveTab(payload) {
  if (!payload) return

  window.postMessage({
    source: MESSAGE_SOURCE,
    type: 'ACTIVE_TAB_CHANGED',
    payload,
  }, window.location.origin)
}

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
  }).then(response => {
    if (response?.type !== ACTIVE_TAB_RESULT) return
    postActiveTab(response.payload)
  }).catch(error => {
    console.error('[StudyUs Extension] Failed to request active tab.', error)
  })
})

chrome.runtime.onMessage.addListener(message => {
  if (message?.type !== 'ACTIVE_TAB_CHANGED') return

  console.info('[StudyUs Extension] Active tab changed:', message.payload)
  postActiveTab(message.payload)
})

console.info('[StudyUs Extension] Tab monitor connected.')
