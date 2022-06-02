<script setup>
import { ref, computed, nextTick, watch } from 'vue'
import { formatCurrency } from './CurrencyFormatter'
import { getAllBots, getBotDeals } from './ThreeCommasDataCache'
import { convertToUSD } from './CryptocurrencyConverter'
import emitter from './event-bus'

const columns = [
  {
    name: 'index',
    label: '#',
    field: 'id',
    format: () => ''
  },
  {
    name: 'name',
    required: true,
    label: 'Name',
    align: 'left',
    field: row => row.name,
    format: val => val,
    sortable: true,
    style:'max-width: 300px'
  },
  { 
    name: 'todayProfit', 
    label: 'Today', 
    field: 'todayProfit', 
    sortable: true,
    format: (val, row) => formatCurrency(val, 'USD'),
    sort: (a, b) =>  a - b,
  },
  { 
    name: 'thisMonthProfit', 
    label: 'This Month', 
    field: 'thisMonthProfit', 
    sortable: true,
    format: (val, row) => formatCurrency(val, 'USD'),
    sort: (a, b) =>  a - b,
  },
  { 
    name: 'totalProfit', 
    label: 'Total', 
    field: 'totalProfit',
    sortable: true,
    format: (val, row) => formatCurrency(val, 'USD'),
    sort: (a, b) =>  a - b,
  },
  { 
    name: 'monthlyRoi', 
    label: 'Monthly ROI', 
    field: 'monthlyRoi', 
    sortable: true, 
    format: (val, row) => (val * 100).toFixed(2) + '%',
    sort: (a, b) =>  a - b },
  { 
    name: 'uPnl', 
    label: 'uPNL of active deals', 
    field: 'uPnl', 
    sortable: true, 
    sort: (a, b) => a - b,
    format: (val, row) => formatCurrency(val, 'USD'),
  },
  { 
    name: 'lockedFunds', 
    label: 'Locked Funds', 
    field: 'lockedFunds',
    sortable: true,
    sort: (a, b) => a - b,
    format: (val, row) => formatCurrency(val, 'USD'),
  },
  { 
    name: 'totalFunds', 
    label: 'Total Funds', 
    field: 'totalFunds',
    sortable: true,
    sort: (a, b) => a - b,
    format: (val, row) => formatCurrency(val, 'USD'),
  },
]

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
  const currentDate = new Date()
  const today = currentDate.setHours(0, 0, 0)
  const thisMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)

  const rows = []

  for (let bot of bots) {
    const diffInMs   = currentDate - new Date(bot.created_at)
    const createdInDays = diffInMs / (1000 * 60 * 60 * 24)

    // Calculate bot cost(total amount of funds available to bot)
    const quoteCurrency = getQuoteCurrency(bot.pairs[0])
    // We assume that BO/SO use Quote currency only!!!
    // TODO: calculate bot cost properly
    const baseOrderCurrency = bot.base_order_volume_type == 'quote_currency' ? 
                                                             quoteCurrency : 
                                                             undefined
    
    const safetyOrderCurrency = bot.safety_order_volume_type == 'quote_currency' ? 
                                                                 quoteCurrency : 
                                                                 undefined

    let baseOrderVolume = +bot.base_order_volume * 
                           bot.max_active_deals * 
                           (bot.allowed_deals_on_same_pair || 1) // fix for Single pair bot

    let safetyOrderMaxVolume = 0
    for (let i = 0; i < +bot.max_safety_orders; i++) {
      safetyOrderMaxVolume += +bot.safety_order_volume * Math.pow(+bot.martingale_volume_coefficient, i)
    }
    safetyOrderMaxVolume *= bot.max_active_deals * (bot.allowed_deals_on_same_pair || 1)
    
    let totalFunds = convertToUSD(baseOrderVolume + safetyOrderMaxVolume, quoteCurrency)

    // Calculate ROI
    const totalProfit = bot.finished_deals_profit_usd
    const monthlyProfit = totalProfit * 30 / createdInDays
    const monthlyRoi = monthlyProfit / totalFunds

    let row = {
      id: bot.id,
      name: bot.name,
      todayProfit: 0,
      todayDealsCount: 0,

      thisMonthProfit: 0,
      thisMonthDealsCount: 0,

      totalProfit,
      calculatedTotalProfit: 0,
      totalDealsCount: bot.finished_deals_count,

      monthlyRoi,
      createdInDays,

      uPnl: +bot.active_deals_usd_profit,
      lockedFunds: 0,
      totalFunds
    }

    let deals = await getBotDeals(bot.id)

    for (let deal of deals) {
      
      if (!deal.closed_at) {

        // Calculate Locked Funds in active deals
        // TODO probably we need to handle situation when BO/SO are in base currency e.g. in CRV 
        // I suppose we use only stablecoins or BTC for BO/SO
        row.lockedFunds += +deal.bought_volume // convertToUSD(+deal.bought_volume, quoteCurrency)
        continue
      }

      let closeDate = new Date(deal.closed_at)
      
      // Caculate Today profit
      if (closeDate >= today) {
        row.todayProfit += +deal.usd_final_profit // need to check what field is correct one
        row.todayDealsCount++
      }

      // Calculate This Month profit
      if (closeDate >= thisMonth) {
        row.thisMonthProfit += +deal.usd_final_profit // need to check what field is correct one
        row.thisMonthDealsCount++
      }
    }

    row.lockedFunds = convertToUSD(row.lockedFunds, quoteCurrency)
    rows.push(row)
  }

  return rows
}

function getQuoteCurrency(pair) {
  const pairSeparatorIndex = pair.indexOf('_')
  return pair.substring(0, pairSeparatorIndex)
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
    row-key="id"
    :flat="true"
    virtual-scroll
    :virtual-scroll-item-size="48"
    :virtual-scroll-sticky-size-start="48"
    :pagination="pagination"
    :rows-per-page-options="[0]"
    @virtual-scroll="onScroll"
    :wrap-cells="true">
      <template v-slot:body-cell-name="props">
        <q-td :props="props">
          {{ props.value }}
          <div class="row q-col-gutter-x-md text-caption">
            <div>{{ Math.round(props.row.createdInDays) }} days</div>
            <div><a :href="`https://3commas.io/bots/` + props.row.id" 
               class="table-link"
               target="_blank">view
            </a></div>
          </div>
        </q-td>
      </template>
      <template v-slot:body-cell-todayProfit="props">
        <q-td :props="props">
          <q-badge v-if="props.row.todayProfit" color="green-4" >{{ props.value }}</q-badge>
          <div v-else> - </div>
          <div class="text-caption">{{ props.row.todayDealsCount }} deals</div>
        </q-td>
      </template>
      <template v-slot:body-cell-thisMonthProfit="props">
        <q-td :props="props">
          <q-badge v-if="props.row.thisMonthProfit" color="green-4" >{{ props.value }}</q-badge>
          <div v-else> - </div>
          <div class="text-caption">{{ props.row.thisMonthDealsCount }} deals</div>
        </q-td>
      </template>
      <template v-slot:body-cell-totalProfit="props">
        <q-td :props="props">
          <q-badge v-if="props.row.totalProfit" color="green-4" >{{ props.value }}</q-badge>
          <div v-else> - </div>
          <div class="text-caption">{{ props.row.totalDealsCount }} deals</div>
        </q-td>
      </template>
      <template v-slot:body-cell-lockedFunds="props">
        <q-td :props="props">
          {{ props.value }}
          <div class="text-caption">{{ Math.round(props.row.lockedFunds * 100 / props.row.totalFunds) }}%</div>
        </q-td>
      </template>
    </q-table>
</template>

<style lang="sass">
.bot-table 
  color: $grey-4

.table-link
  color: $grey-4
</style>