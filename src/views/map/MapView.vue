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
    width: 350px;
    -webkit-box-shadow: 0 0 32px rgba(136, 152, 170, 0.4);
    z-index: 10;
  }
  .divMap {
    width: 100%;
    height: 100vh;
  }
</style>
