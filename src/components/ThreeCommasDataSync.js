import { useThreeCommasClient } from './ThreeCommasClient'
import { cacheBots, 
         cacheDeals, 
         getBotsCount, 
         getAllDealsCount,
         getAllFinishedDealsCount, 
         deleteBots,
         deleteDeals } from './ThreeCommasDataCache'

const realApi = useThreeCommasClient('real')
const paperApi = useThreeCommasClient('paper')

export async function syncBots(progressCallback) {
  let params = { limit: 100, offset: 0 }
  await syncData(realApi.getBots.bind(realApi), { ...params }, cacheBots, progressCallback)
  await syncData(paperApi.getBots.bind(paperApi), { ...params }, cacheBots, progressCallback)
  // Let subscriber know that task is finished
  progressCallback([], true)
}

export async function syncDeals(progressCallback) {
  // Calculate next offset to perform incremental smart sync instead of full resync 
  let offset = await getAllFinishedDealsCount()
  let params = { limit: 1000, offset, order: 'closed_at', order_direction: 'asc' }
  
  await syncData(realApi.getDeals.bind(realApi), { ...params }, cacheDeals, progressCallback)
  await syncData(paperApi.getDeals.bind(paperApi), { ...params }, cacheDeals, progressCallback)
  // Let subscriber know that task is finished
  progressCallback([], true)
}

async function syncData(apiCallback, apiParams, cacheDataCallback, progressCallback) {
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

    // Notify subscriber that new data chunk received
    progressCallback(data)

    var hasMoreData = data.length == runningRequestsBrowserLimit * apiParams.limit
  } while (hasMoreData)
}