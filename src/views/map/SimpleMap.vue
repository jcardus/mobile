<template>
  <div id="simpleMap" style="width: 100%; height: 100%">
  </div>
</template>

<script>
import mapboxgl from 'mapbox-gl'
export default {
  name: 'SimpleMap',
  static() {
    return {
      simpleMap: null
    }
  },
  mounted() {
    this.$static.simpleMap = new mapboxgl.Map({
      container: 'simpleMap',
      center: [-74.5, 40], // starting position [lng, lat]
      style: 'mapbox://styles/mapbox/streets-v11'
    })
  }
}
</script>

<style scoped>

</style>
