const STUDYUS_PAGE_PATTERNS = [
  'http://localhost:5173/*',
  'http://127.0.0.1:5173/*',
]

function createTabPayload(tab) {
  if (!tab.url) return null

  try {
    const url = new URL(tab.url)

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null
    }

    return {
      hostname: url.hostname,
      title: tab.title ?? '',
      changedAt: new Date().toISOString(),
    }
  } catch {
    return null
  }
}

async function notifyStudyUs(tab) {
  const payload = createTabPayload(tab)
  if (!payload) return

  const studyUsTabs = await chrome.tabs.query({ url: STUDYUS_PAGE_PATTERNS })

  await Promise.allSettled(
    studyUsTabs.map(studyUsTab =>
      chrome.tabs.sendMessage(studyUsTab.id, {
        type: 'ACTIVE_TAB_CHANGED',
        payload,
      }),
    ),
  )
}

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    const tab = await chrome.tabs.get(tabId)
    await notifyStudyUs(tab)
  } catch (error) {
    console.error('[StudyUs] Failed to process activated tab.', error)
  }
})

chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' && !changeInfo.url) return

  chrome.tabs.query({ active: true, currentWindow: true }).then(([activeTab]) => {
    if (activeTab?.id !== tab.id) return
    return notifyStudyUs(tab)
  }).catch(error => {
    console.error('[StudyUs] Failed to process updated tab.', error)
  })
})
