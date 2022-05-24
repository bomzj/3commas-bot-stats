<script setup>
import { ref, watch, watchEffect } from 'vue'
import { useQuasar } from 'quasar'
import { syncAccounts, syncBots, syncDeals }  from './ThreeCommasDataSync'

const $q = useQuasar()
let syncing = ref(false)

async function syncData() {
  syncing.value = true
  await syncAccounts(createProgressHandler('accounts'))
  await syncBots(createProgressHandler('bots'))
  //await syncDeals(createProgressHandler('deals'))
  syncing.value = false
}

function createProgressHandler(itemsName) {
  let notify = $q.notify({
    group: false, // required to be updatable
    timeout: 0, // we want to be in control when it gets dismissed
    spinner: true,
    message: `Syncing ${itemsName}...`,
    caption: '0',
    position: 'top'
  })
  
  return onSyncProgress.bind( { notify, itemsName, syncedItemsCount: 0 })
}

function onSyncProgress(data, done) {
  this.syncedItemsCount += data.length

  // Update progress bar
  this.notify({
    caption: this.syncedItemsCount.toString(),
  })
  
  // Hide progress bar after completion
  if (done) {
    this.notify({
      icon: 'done',
      spinner: false,
      message: `Syncing ${this.itemsName} done!`,
      caption: `${this.syncedItemsCount} ${this.itemsName}`,
      timeout: 5000
    })
  }
}
</script>

<template>
  <q-btn color="primary" 
         label="Sync Data" 
         icon="refresh" 
         @click="syncData" 
         :loading="syncing"/>
</template>

<style scoped>

</style>