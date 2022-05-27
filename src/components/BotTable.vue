<script setup>
import { ref, computed, nextTick, watch } from 'vue'
import { formatCurrency } from './CurrencyFormatter'
import { getAllBots } from './ThreeCommasDataCache'
import emitter from './event-bus'

const columns = [
  {
    name: 'index',
    label: '#',
    field: 'index'
  },
  {
    name: 'name',
    required: true,
    label: 'Name',
    align: 'left',
    field: row => row.name,
    format: val => val,
    sortable: true
  },
  { name: 'todayProfit', align: 'center', label: 'Today', field: 'todayProfit', sortable: true },
  { name: 'monthProfit', label: 'Current Month', field: 'fat', sortable: true },
  { 
    name: 'totalProfit', 
    label: 'Total', 
    field: 'finished_deals_profit_usd',
    format: (val, row) => formatCurrency(val, 'USD'),
  },
  { 
    name: 'monthlyRoi', 
    label: 'Monthly ROI', 
    field: 'iron', 
    sortable: true, 
    sort: (a, b) =>  a - b },
  { 
    name: 'uPNL', 
    label: 'uPNL of active deals', 
    field: 'active_deals_usd_profit', 
    sortable: true, 
    sort: (a, b) => a - b,
    format: (val, row) => formatCurrency(val, 'USD'),
  },
  { 
    name: 'fundsLocked', 
    label: 'Funds locked in deals', 
    field: 'sodium',
    format: (val, row) => formatCurrency(val, 'USD'),
  },
]

// allRows.value.forEach((row, index) => {
//   row.index = index
// })

let bots = await getAllBots()

const loading = ref(false)
const rows = ref(bots)
const pageSize = 50
const nextPage = ref(2)
let lastPage = 3
const pagination = { rowsPerPage: 0 }

emitter.on('end:syncing', async () => {
  rows.value = await getAllBots()
})
// watch(store, () => {
//   console.log('bots loaded into table')
//   rows.value.push(...store.bots)
// })

async function loadMoreData() {
  console.log('load more')
  
  let bots = await api.getBots({ 
    limit: pageSize, 
    scope: 'enabled', 
    account_id: 30697452,
    offset: pageSize * (nextPage.value - 2)
  }) 
  
  nextPage.value++

  if (bots.length) {
    rows.value.push(...bots)
    lastPage++
  }
  //console.log(bots)
}

async function onScroll({ to, ref }) {
  const lastIndex = rows.value.length - 1

  console.log('onScroll to before refresh() ' + to)

  if (loading.value !== true && nextPage.value < lastPage && to === lastIndex) {
    // loading.value = true
    // await loadMoreData()
    // loading.value = false
    //  nextTick(() => {
    //   ref.refresh()
    //   loading.value = false
    // })
  }
}
</script>

<template>
  <div class="q-pa-md">
    <q-table
      class="my-sticky-dynamic"
      title="Bots"
      :rows="rows"
      :columns="columns"
      :loading="loading"
      row-key="index"
      virtual-scroll
      :virtual-scroll-item-size="48"
      :virtual-scroll-sticky-size-start="48"
      :pagination="pagination"
      :rows-per-page-options="[0]"
      @virtual-scroll="onScroll" />
  </div>
</template>

<style lang="sass">
.my-sticky-dynamic
  /* height or max-height is important */
  /* height: 410px */

  .q-table__top,
  .q-table__bottom,
  thead tr:first-child th /* bg color is important for th; just specify one */
    background-color: #fff

  thead tr th
    position: sticky
    z-index: 1
  /* this will be the loading indicator */
  thead tr:last-child th
    /* height of all previous header rows */
    top: 48px
  thead tr:first-child th
    top: 0
</style>