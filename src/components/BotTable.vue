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
      @virtual-scroll="onScroll"
    />
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import useThreeCommasApiProxy from './ThreeCommasApiProxy'
import axios from 'axios'

async function test() {
  let wiki = await axios('https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Image_created_with_a_mobile_phone.png/1024px-Image_created_with_a_mobile_phone.png')

  console.log(wiki.status)
  console.log(wiki.data.length)
}

test()

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
  { name: 'calories', align: 'center', label: 'Calories', field: 'calories', sortable: true },
  { name: 'fat', label: 'Fat (g)', field: 'fat', sortable: true },
  { name: 'carbs', label: 'Carbs (g)', field: 'carbs' },
  { name: 'protein', label: 'Protein (g)', field: 'protein' },
  { name: 'sodium', label: 'Sodium (mg)', field: 'sodium' },
  { name: 'calcium', label: 'Calcium (%)', field: 'calcium', sortable: true, sort: (a, b) => parseInt(a, 10) - parseInt(b, 10) },
  { name: 'iron', label: 'Iron (%)', field: 'iron', sortable: true, sort: (a, b) => parseInt(a, 10) - parseInt(b, 10) }
]



// allRows.value.forEach((row, index) => {
//   row.index = index
// })

const rows = ref([])
const pageSize = 50
const nextPage = ref(2)
let lastPage = 3
const pagination = { rowsPerPage: 0 }

const loading = ref(false)
const api = useThreeCommasApiProxy()

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

async function preloadData() {
  // Warm up Netlify functions to avoid Timeout issues
  try {
    await api.getAccount(30697452)
  } finally {
  }
}

//preloadData()

async function onScroll({ to, ref }) {
  const lastIndex = rows.value.length - 1

  console.log('onScroll to before refresh() ' + to)

  if (loading.value !== true && nextPage.value < lastPage && to === lastIndex) {
    loading.value = true
    await loadMoreData()
    loading.value = false
    //  nextTick(() => {
    //   ref.refresh()
    //   loading.value = false
    // })
  }
}
</script>

<style lang="sass">
.my-sticky-dynamic
  /* height or max-height is important */
  height: 410px

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