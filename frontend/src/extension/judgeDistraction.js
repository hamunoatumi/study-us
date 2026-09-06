const DISTRACTION_HOSTS = [
  'youtube.com',
  'instagram.com',
  'x.com',
]

export function judgeDistraction(tabInfo) {     
  const hostname = tabInfo.hostname.toLowerCase()       // 小文字

  const isDistracted = DISTRACTION_HOSTS.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`))

  if (isDistracted) { return 'distracted'}
  return 'studying'
}