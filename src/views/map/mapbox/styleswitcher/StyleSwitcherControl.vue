<template>
  <div class="mapboxgl-ctrl mapboxgl-ctrl-group">
    <div class="mapboxgl-style-list">
      <button v-for="style in styles" :key="style.title" :class="style.title.replace(/[^a-z0-9-]/gi, '_')">
        ${{ style.title }}
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'StyleSwitcherControl',
  data: function() {
    return {
      default: 'Streets',
      styles: [
        { title: 'Dark', uri: 'mapbox://styles/mapbox/dark-v10' },
        { title: 'Light', uri: 'mapbox://styles/mapbox/light-v9' },
        { title: 'Outdoors', uri: 'mapbox://styles/mapbox/outdoors-v11' },
        { title: 'Satellite', uri: 'mapbox://styles/mapbox/satellite-streets-v11' },
        { title: 'Streets', uri: 'mapbox://styles/mapbox/streets-v11' }
      ]
    }
  }
}
</script>

<style scoped>

</style>
