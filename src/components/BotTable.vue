<script setup>
import { ref, computed, nextTick, watch } from 'vue'
import { formatCurrency } from './CurrencyFormatter'
import { getAllBots, getBotDeals } from './ThreeCommasDataCache'
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
    sortable: true,
    style: 'width:300px'
  },
  { 
    name: 'todayProfit', 
    align: 'center', 
    label: 'Today', 
    field: 'todayProfit', 
    sortable: true,
    format: (val, row) => formatCurrency(val, 'USD'),
    sort: (a, b) =>  a - b,
  },
  { name: 'monthProfit', label: 'This Month', field: 'fat', sortable: true },
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
let tableData = await getTableData(bots)

const loading = ref(false)
const rows = ref(tableData)
const pageSize = 50
const nextPage = ref(2)
let lastPage = 3
const pagination = { rowsPerPage: 0 }

emitter.on('end:syncing', async () => {
  let bots = await getAllBots()
  rows.value = await getTableData(bots)
})
// watch(store, () => {
//   console.log('bots loaded into table')
//   rows.value.push(...store.bots)
// })

async function getTableData(bots) {
  const today = new Date().setHours(0, 0, 0)
  const rows = []
  
  for (let bot of bots) {
    let row = {
      name: bot.name,
      todayProfit: 0,
      todayDealsCount: 0,
    }

    let deals = await getBotDeals(bot.id)

    for (let deal of deals) {
      if (!deal.closed_at) continue
    
      let closeDate = new Date(deal.closed_at)
      
      if (closeDate >= today) {
        row.todayProfit += +deal.usd_final_profit // need to check what field is correct one
        row.todayDealsCount++
      }
    }

    rows.push(row)
  }

  return rows
}

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
  <q-table
    class="bot-table"
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
    @virtual-scroll="onScroll"
    wrap-cells="true">
      <template v-slot:body-cell-todayProfit="props">
        <q-td :props="props">
          <q-badge v-if="props.row.todayProfit" color="green-4" >{{ props.value }}</q-badge>
          <div v-else> - </div>
          <div class="text-caption">{{ props.row.todayDealsCount }} deals</div>
        </q-td>
      </template>
    </q-table>
</template>

<style lang="sass">
.bot-table 
  color: $grey-4
</style>