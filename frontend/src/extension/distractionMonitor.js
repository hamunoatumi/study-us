import {receiveStudyUsTabInfo} from './receiveStudyUsTabInfo.js'
import {judgeDistraction} from './judgeDistraction.js'

export function startDistractionMonitor(onStatusChange) {
  return receiveStudyUsTabInfo((tabInfo) => {
    const status =judgeDistraction(tabInfo)
    onStatusChange(status)
  })
}