<template>
  <div class="row">
    <div class="divVehicles">
      <vehicle-table-container></vehicle-table-container>
    </div>
    <div class="divMap">
      <vue-map></vue-map>
    </div>
  </div>
</template>

<script>
import VehicleTableContainer from './VehicleTableContainer'
import VueMap from './VueMap'
export default {
  name: 'MapView',
  components: { VehicleTableContainer, VueMap }
}
</script>
<style>
  .row {
    display: flex;
  }
  .divVehicles {
    min-width: 300px;
    max-width:300px;
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
