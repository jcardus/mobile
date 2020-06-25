<template>
  <div class="row">
    <div class="divData" :style="`min-width: ${tableWidth}px;width: ${tableWidth}px;`">
      <data-container></data-container>
    </div>
    <div class="divMap">
      <vue-map></vue-map>
    </div>
  </div>
</template>

<script>
import DataContainer from './DataContainer'
import VueMap from './VueMap'
import { mapGetters } from 'vuex'

export default {
  name: 'MapView',
  components: { DataContainer, VueMap },
  computed: {
    ...mapGetters(['tableCollapsed']),
    tableWidth() {
      return this.tableCollapsed ? 0 : 300
    }
  }
}
</script>
<style>
  .row {
    display: flex;
  }
  .divData {
    -webkit-box-shadow: 0 0 32px rgba(136, 152, 170, 0.4);
    z-index: 10;
  }
  .divMap {
    width: 100%;
    height: calc(100vh - 16px);
    padding-left: 8px;
    padding-right: 8px;
    padding-top: 8px;
  }
</style>
