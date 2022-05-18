<script setup>
import BotTable from './components/BotTable.vue'

import SyncButton from './components/SyncButton.vue';
</script>

<template>
  <q-layout view="hhh lpR fff">

    <q-header reveal class="bg-primary text-white">
      <q-toolbar>
        <q-toolbar-title>
          <q-avatar>
            <img src="https://cdn.quasar.dev/logo-v2/svg/logo-mono-white.svg">
          </q-avatar>
          3Commas Bot Stats
        </q-toolbar-title>
       <SyncButton />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <q-page><BotTable /></q-page>
    </q-page-container>

    <q-footer elevated class="bg-grey-8 text-white">
      <q-toolbar>
        <q-toolbar-title>
          <q-avatar>
            <img src="https://cdn.quasar.dev/logo-v2/svg/logo-mono-white.svg">
          </q-avatar>
          <div>3Commas Bot Stats</div>
        </q-toolbar-title>
      </q-toolbar>
    </q-footer>

  </q-layout>
</template>