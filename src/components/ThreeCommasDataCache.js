import { openDB } from 'idb/with-async-ittr'

let realDb = await openDb('3CommasRealCache')
let paperDb = await openDb('3CommasPaperCache')

function openDb(name) {
  return openDB(name, 1, {
    upgrade(db) {
      db.createObjectStore('accounts', { keyPath: 'id' })
      db.createObjectStore('bots', { keyPath: 'id' })
      
      db.createObjectStore('deals', { keyPath: 'id' })
        .createIndex('closed_at', 'closed_at')
    }
  })
}

export async function getRealAccounts() { return realDb.getAll('accounts') }
export async function getPaperAccount() { return paperDb.getAll('accounts') }

export async function getAllBots() {
  let tx = realDb.transaction('bots', 'readonly')
  //return await tx.store.index('custom').getAll(IDBKeyRange.only(31457974))
  //return db.getAllFromIndex('bots', 'custom', IDBKeyRange.only('Kucoin31457974'))
  return realDb.getAllFromIndex('bots', 'custom', IDBKeyRange.only(['Kucoin']))
  //return await db.getAll('bots',  IDBKeyRange.only(8031804))
}

export async function getBotsCount() {
  return await  realDb.count('bots', IDBKeyRange.only())
}

export async function deleteBots() {
  return await realDb.clear('bots')
}

export async function getBotDeals(botId, dealStatus) {
  //return await db.getAll('bots')
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