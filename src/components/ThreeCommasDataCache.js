import { openDB } from 'idb'

// Init Indexed DB to store bots/deals
let db = await openDB('3CommasCache', 1, {
  upgrade(db) {
    db.createObjectStore('accounts', { keyPath: 'id' })
    db.createObjectStore('bots', { keyPath: 'id' })
    
    db.createObjectStore('deals', { keyPath: 'id' })
      .createIndex('closed_at', 'closed_at')
  }
})

export async function getAllBots() {
  let tx = db.transaction('bots', 'readonly')
  //return await tx.store.index('custom').getAll(IDBKeyRange.only(31457974))
  //return db.getAllFromIndex('bots', 'custom', IDBKeyRange.only('Kucoin31457974'))
  return db.getAllFromIndex('bots', 'custom', IDBKeyRange.only(['Kucoin']))
  //return await db.getAll('bots',  IDBKeyRange.only(8031804))
}

export async function getBotsCount() {
  return await  db.count('bots', IDBKeyRange.only())
}

export async function deleteBots() {
  return await db.clear('bots')
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
  return await db.count('deals')
}

export async function getActiveDealsCount() {
  let [totalCount, finishedCount] = await Promise.all([
    getAllDealsCount(), 
    getAllFinishedDealsCount()])

  return totalCount - finishedCount
}

export async function getAllFinishedDealsCount() {
  return await db.countFromIndex('deals', 'closed_at', IDBKeyRange.lowerBound(' '))
}

export async function deleteDeals() {
  return await db.clear('deals')
}

export async function cacheAccounts(accounts) {
  return await cacheItems(accounts, 'accounts')
}

export async function cacheBots(bots) {
  return await cacheItems(bots, 'bots')
}

export async function cacheDeals(deals) {
  return await cacheItems(deals, 'deals')
}

async function cacheItems(items, storeName) {
  let tx = db.transaction(storeName, 'readwrite')

  for (let item of items) 
    tx.store.put(item)

  return tx.done
}