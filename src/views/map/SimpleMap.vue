<template>
  <div id="simpleMap" style="width: 100%; height: 90%">
  </div>
</template>

<script>
import mapboxgl from 'mapbox-gl'
export default {
  name: 'SimpleMap',
  props: {
    position: {
      type: Object,
      default: null
    }
  },
  watch: {
    position() {
      const latlon = [this.position.longitude, this.position.latitude]
      this.simpleMap.setCenter(latlon)
      new mapboxgl.Marker()
        .setLngLat(latlon)
        .addTo(this.simpleMap)
    }
  },
  static() {
    return {
      simpleMap: null
    }
  },
  mounted() {
    this.simpleMap = new mapboxgl.Map({
      container: 'simpleMap',
      style: 'mapbox://styles/mapbox/streets-v11',
      zoom: 10
    })
  }
}
</script>

<style scoped>

</style>
