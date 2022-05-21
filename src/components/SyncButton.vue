<script setup>
import { ref, watch, watchEffect } from 'vue'
import { syncAll }  from './ThreeCommasDataSync'

let loading = ref(false)

async function onClick() {
  loading.value = true
  await syncAll()
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