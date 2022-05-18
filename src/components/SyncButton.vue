<script setup>
import { ref, watch, watchEffect } from 'vue'
import { store, syncBots, syncDeals }  from './store'

//let botsStats = await api.getBotsStats({bot_id: 8931661})

let loading = ref(false)

async function onClick() {
  loading.value = true
  await syncBots()
  await syncDeals()
  loading.value = false
}
</script>

<template>
  <q-btn color="primary" 
         label="Sync Data" 
         icon="refresh" 
         @click="onClick" 
         :loading="loading"/>
</template>

<style scoped>

</style>
