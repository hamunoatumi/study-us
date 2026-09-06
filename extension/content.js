const MESSAGE_SOURCE = 'studyus-extension'

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
