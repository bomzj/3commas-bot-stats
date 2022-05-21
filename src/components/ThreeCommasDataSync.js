import { useSSRContext } from 'vue'
import { useThreeCommasClient } from './ThreeCommasClient'
import { cacheBots, 
         cacheDeals, 
         getBotsCount, 
         getDealsCount, 
         deleteBots,
         deleteDeals } from './ThreeCommasDataCache'

const realApi = useThreeCommasClient('real')
const paperApi = useThreeCommasClient('paper')

export async function syncAll(resync = false) {
  const messageToLogOnComplete = `syncing bots/deals completed`
  console.time(messageToLogOnComplete)
  
  await syncBots(resync)
  //await syncDeals(resync)

  console.timeEnd(messageToLogOnComplete)
}

export async function syncBots(resync = false) {
  if (resync) await deleteBots()
  let offset = resync ? 0 : 0// getBotsCount()
  syncData(realApi.getBots.bind(realApi), { limit: 100, offset: 0 }, cacheBots)
  syncData(paperApi.getBots.bind(paperApi), { limit: 100, offset: 0 }, cacheBots)
}

export async function syncDeals(resync = false) {
  if (resync) await deleteDeals()
  let offset = resync ? 0 : 0//getDealsCount()
  syncData('getDeals', 500, offset, cacheDeals)
}

async function syncData(apiCallback, apiParams, cacheDataCallback) {
  // Browser can make 6 HTTP/1 connections per domain at a time
  const runningRequestsBrowserLimit = 6

  do {
    let requests = []

    for (let i = 0; i < runningRequestsBrowserLimit; i++) {
      let request = apiCallback(apiParams)
      requests.push(request)
      apiParams.offset += apiParams.limit
    }

    let data = (await Promise.all(requests)).flat()
    await cacheDataCallback(data)

    var hasMoreData = data.length == runningRequestsBrowserLimit * apiParams.limit
  } while (hasMoreData)
}