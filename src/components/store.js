import { reactive, watch, toRaw } from 'vue'
import { openDB } from 'idb'
import { useThreeCommasClient } from './ThreeCommasClient'

export const store = reactive({
  bots: [],
  deals: [],

  loadFromIndexedDb,
  saveItemsToIndexedDbStore: saveItemsToIndexedDbStore
})

// Open Indexed DB for loading/saving the state
let db = await openDB('state', 1, {
  upgrade(db) {
    db.createObjectStore('bots', { keyPath: 'id' })
    db.createObjectStore('deals', { keyPath: 'id' })
  }
})


await loadFromIndexedDb()

// Track state changes and save to Indexed DB
//watch(store, save)

async function loadFromIndexedDb() {
  store.bots = await db.getAll('bots')
  //store.deals = await db.getAll('deals')
}

async function saveItemsToIndexedDbStore(items, storeName) {
  let tx = db.transaction(storeName, 'readwrite')

  for (let item of items) 
    tx.store.put(item)

  return tx.done
}

   //     account_id: 30697452,

export async function syncBots() {
  // Browser allows 6 connections only per domain at a time for HTTP/1 which 3commas is using
  const runningRequestsBrowserLimit = 6
  const botsPerRequestLimit = 100
  
  console.time('syncing bots completed')
  
  // Sync data from both Real and Paper accounts
  for (let accountType of [false, true]) {
    const client = useThreeCommasClient(accountType)
    let offset = 0

    // Sync data from 1 of 2 account types
    do {
      let requests = []

      for (let i=0; i < runningRequestsBrowserLimit; i++) {
        requests.push(client.getBots({ limit: botsPerRequestLimit, offset }))
        offset += botsPerRequestLimit
      }

      let data = (await Promise.all(requests)).flat()
      await saveItemsToIndexedDbStore(data, 'bots')
      
      var hasMoreData = data.length == runningRequestsBrowserLimit * botsPerRequestLimit
    } while (hasMoreData)
  }
  console.timeEnd('syncing bots completed')
}

export async function syncDeals() {
  // Browser allows 6 connections only per domain at a time for HTTP/1 which 3commas is using
  const runningRequestsBrowserLimit = 6
  const dealsPerRequestLimit = 500
 
  console.time('syncing deals completed')

  // Sync data from both Real and Paper accounts
  for (let accountType of [false, true]) {
    const client = useThreeCommasClient(accountType)
    let offset = 0

    // Sync data from 1 of 2 account types
    do {
      let requests = []

      for (let i=0; i < runningRequestsBrowserLimit; i++) {
        requests.push(client.getDeals({ limit: dealsPerRequestLimit, offset }))
        offset += dealsPerRequestLimit
      }

      let data = (await Promise.all(requests)).flat()
      await saveItemsToIndexedDbStore(data, 'deals')

      if (data.length != runningRequestsBrowserLimit * dealsPerRequestLimit)
        console.log(data.length)

      var hasMoreData = data.length == runningRequestsBrowserLimit * dealsPerRequestLimit
    } while (hasMoreData)
  }
  console.timeEnd('syncing deals completed')
}