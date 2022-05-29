import { openDB } from 'idb/with-async-ittr'

let realDb = await openDb('3CommasRealCache')
let paperDb = await openDb('3CommasPaperCache')

function openDb(name) {
  return openDB(name, 1, {
    upgrade(db) {
      db.createObjectStore('accounts', { keyPath: 'id' })
      db.createObjectStore('bots', { keyPath: 'id' })
      
      let store = db.createObjectStore('deals', { keyPath: 'id' })
      store.createIndex('closed_at', 'closed_at')
      store.createIndex('bot_id', 'bot_id')

    }
  })
}

export async function getRealAccounts() { return realDb.getAll('accounts') }
export async function getPaperAccounts() { return paperDb.getAll('accounts') }

export async function getAllBots() {
  return (await Promise.all([realDb.getAll('bots'), paperDb.getAll('bots')])).flat()
}

export async function getBotDeals(botId) {
  let bot = await realDb.get('bots', IDBKeyRange.only(botId))
  let db = bot ? realDb : paperDb
  return db.getAllFromIndex('deals', 'bot_id', IDBKeyRange.only(botId))
}


export async function getBotsCount() {
  return await realDb.count('bots', IDBKeyRange.only())
}

export async function deleteBots() {
  return await realDb.clear('bots')
}

/**
 * Returns total count of deals filtered by:
 * @param botId bot specified deals or undefined to return all deals
 * @param dealStatus possible values: [active, completed] or undefined 
 */
export async function getAllDealsCount() {
  return await realDb.count('deals')
}

export async function getActiveDealsCount() {
 
}

export async function getFinishedRealDealsCount() { 
  return getFinishedDealsCount(realDb) 
}

export async function getFinishedPaperDealsCount() {
  return getFinishedDealsCount(paperDb) 
}

async function getFinishedDealsCount(db = realDb) {
  return db.countFromIndex('deals', 'closed_at', IDBKeyRange.lowerBound(' '))
}

export async function deleteDeals() {
  return await realDb.clear('deals')
}

export async function cacheRealAccounts(accounts) {
  return await cacheItems(accounts, 'accounts', realDb)
}

export async function cachePaperAccounts(accounts) {
  return await cacheItems(accounts, 'accounts', paperDb)
}

export async function cacheRealBots(bots) {
  return await cacheItems(bots, 'bots', realDb)
}

export async function cachePaperBots(bots) {
  return await cacheItems(bots, 'bots', paperDb)
}

export async function cacheRealDeals(deals) {
  return await cacheItems(deals, 'deals', realDb)
}

export async function cachePaperDeals(deals) {
  return await cacheItems(deals, 'deals', paperDb)
}

async function cacheItems(items, storeName, db = realDb) {
  let tx = db.transaction(storeName, 'readwrite')

  for (let item of items) 
    tx.store.put(item)

  return tx.done
}