import { useThreeCommasClient } from './ThreeCommasClient'
import { cacheRealAccounts, cachePaperAccounts,
         cacheRealBots, cachePaperBots,
         cacheRealDeals, cachePaperDeals, 
         getFinishedRealDealsCount,
         getFinishedPaperDealsCount } from './ThreeCommasDataCache'

const realApi = useThreeCommasClient('real')
const paperApi = useThreeCommasClient('paper')

export async function syncAccounts(progressCallback) {
  let params = { per_page: 100 }
  
  await syncData(realApi.accounts.bind(realApi), 
                 { ...params }, 
                 cacheRealAccounts, 
                 progressCallback, 
                 1)
  
  await syncData(paperApi.accounts.bind(paperApi), 
                 { ...params }, 
                 cachePaperAccounts, 
                 progressCallback, 
                 1)
}

export async function syncBots(progressCallback) {
  let params = { limit: 100, offset: 0 }
  
  await syncData(realApi.getBots.bind(realApi), 
                 { ...params }, 
                 cacheRealBots, 
                 progressCallback, 
                 1)

  await syncData(paperApi.getBots.bind(paperApi), 
                 { ...params }, 
                 cachePaperBots, 
                 progressCallback, 
                 1)
}

export async function syncDeals(progressCallback) {
  // Calculate next offset to perform incremental smart sync instead of full resync 
  let paperOffset = await getFinishedPaperDealsCount()
  let realOffset = await getFinishedRealDealsCount()
  let params = { limit: 1000, order: 'closed_at', order_direction: 'asc' }
  console.log('realOffset', realOffset, 'paperOffset', paperOffset)
  
  await syncData(realApi.getDeals.bind(realApi), 
                 { ...params, offset: realOffset }, 
                 cacheRealDeals, 
                 progressCallback)
  
  await syncData(paperApi.getDeals.bind(paperApi), 
                 { ...params, offset: paperOffset  }, 
                 cachePaperDeals, 
                 progressCallback)
}

async function syncData(apiCallback, 
                        apiParams, 
                        cacheDataCallback, 
                        progressCallback,
                        // Default to max number of HTTP/1 connections per domain at a time
                        // Browser can make
                        pendingRequestsLimit = 6) {
  do {
    let requests = []

    for (let i = 0; i < pendingRequestsLimit; i++) {
      let request = apiCallback(apiParams)
      requests.push(request)
      apiParams.offset += apiParams.limit
    }

    let data = (await Promise.all(requests)).flat()
    await cacheDataCallback(data)

    // Notify subscriber that new data chunk received
    progressCallback(data)

    var hasMoreData = data.length == pendingRequestsLimit * apiParams.limit
  } while (hasMoreData)
}