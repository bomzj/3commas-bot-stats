import { openDB } from 'idb'

// Init Indexed DB to store bots/deals
let db = await openDB('3CommasCache', 1, {
  upgrade(db) {
    db.createObjectStore('bots', { keyPath: 'id' })
      .createIndex('custom', ['account_name', 'account_id'])
    
    db.createObjectStore('deals', { keyPath: 'id' })
    
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

export async function getDeals(botId) {
  //return await db.getAll('bots')
}

export async function getDealsCount() {
  return await db.count('deals')
}

export async function deleteDeals() {
  return await db.clear('deals')
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