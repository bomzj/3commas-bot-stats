<script setup>
import { inject, ref, watch, watchEffect } from 'vue'
import { useQuasar } from 'quasar'
import { syncAccounts, syncBots, syncDeals }  from './ThreeCommasDataSync'
import emitter from './event-bus'

const $q = useQuasar()
let syncing = ref(false)

async function syncData() {
  try {
    syncing.value = true
    
    let counters = [0, 0, 0]

    var notify = $q.notify({
      group: false, // required to be updatable
      timeout: 0, // we want to be in control when it gets dismissed
      spinner: true,
      html: true,
      message: `Syncing data...`,
      caption: getProgressMessage(...counters, 0),
      position: 'top',
      classes: 'notify'
    })

    await syncAccounts(createProgressHandler(notify, counters, 0))
    await syncBots(createProgressHandler(notify, counters, 1))
    console.time('syncing')
    await syncDeals(createProgressHandler(notify, counters, 2))
    console.timeEnd('syncing')
    
    emitter.emit('end:syncing')

    // Hide progress bar after completion
    notify({
      icon: 'done',
      spinner: false,
      message: `Syncing done!`,
      caption: getProgressMessage(...counters),
      timeout: 5000
    })
  } catch (error) {
    console.error(error)
    
    // dismiss progress bar
    notify()

    $q.notify({
        type: 'negative',
        message: 'Sync failed. Try to sync again.',
        timeout: 0,
        position: 'top',
        actions: [{ icon: 'close', color: 'white' }],
    })
  } finally {
    syncing.value = false
  }
}

function createProgressHandler(notify, counters, currentCounterIndex) {
  notify({
    caption: getProgressMessage(...counters, currentCounterIndex)
  })
  return onSyncProgress.bind({ notify, counters, currentCounterIndex })
}

function onSyncProgress(data, done) {
  this.counters[this.currentCounterIndex] += data.length

  // Update progress bar
  this.notify({
    caption: getProgressMessage(...this.counters, this.currentCounterIndex),
  })
}

function getProgressMessage(syncedAccountsCounter, 
                            syncedBotsCounter, 
                            syncedDealsCounter, 
                            currentCounterIndex, ) {
  let messages = [`${syncedAccountsCounter} accounts`, 
                  `${syncedBotsCounter} bots`,
                  `${syncedDealsCounter} deals`]

  messages[currentCounterIndex] = `<strong>${messages[currentCounterIndex]}</strong>`

  return messages.join('<br>')
}
</script>

<template>
  <q-btn color="primary" 
         :label="syncing ? 'Syncing...' : 'Sync Data'"
         icon="refresh" 
         @click="syncData" 
         :disable="syncing"/>
</template>

<style scope>
  .notify {
    min-width: 200px
  }
</style>