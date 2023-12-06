<template>
  <div class="mapboxgl-ctrl mapboxgl-ctrl-group">
    <button v-show="btnVisible" class="mapboxgl-ctrl-icon mapboxgl-style-switcher" @click="btnClick"></button>
    <div v-show="containerVisible" ref="controlContainer" class="mapboxgl-style-list">
      <button
        v-for="style in styles"
        :key="style.title"
        :class="style.title === mapType ? 'active': ''"
        @click="styleClicked(style.title)"
      >
        {{ style.title }}
      </button>
    </div>
  </div>
</template>

<script>

import { vm } from '@/main'
import { mapGetters } from 'vuex'
import { getPartnerByUser } from '@/utils/partner'

export default {
  name: 'StyleSwitcherControl',
  data() {
    return {
      btnVisible: true,
      containerVisible: false,
      styles: [
        { title: 'Dark', uri: 'mapbox://styles/mapbox/dark-v10' },
        { title: 'Light', uri: 'mapbox://styles/mapbox/light-v11' },
        { title: 'Satellite', uri: 'mapbox://styles/mapbox/satellite-streets-v11' },
        { title: 'Streets', uri: 'mapbox://styles/mapbox/streets-v11' }
      ]
    }
  },
  computed: {
    ...mapGetters(['mapType', 'user']),
    map() { return vm.$static.map },
    geofencesVisible() { return vm.$store.state.map.showGeofences },
    lineGeofencesVisible() { return vm.$store.state.map.showLineGeofences },
    poisVisible() { return vm.$store.state.map.showPOIs },
    buildingsVisible() { return vm.$store.state.map.show3dBuildings }
  },
  mounted() {
    let tileRoads = `https://mt0.google.com/vt/lyrs=m&hl=${navigator.language}&x={x}&y={y}&z={z}&s=Ga`
    let tileSatellite = `https://mt0.google.com/vt/lyrs=y&hl=${navigator.language}&x={x}&y={y}&z={z}&s=Ga`
    const partner = getPartnerByUser(this.user)
    if (!partner || partner.partnerId === 5) {
      tileRoads = `https://d831cxdfrpk69.cloudfront.net/?x={x}&y={y}&z={z}&type=roads`
      tileSatellite = `https://d831cxdfrpk69.cloudfront.net/?x={x}&y={y}&z={z}&type=satellite`
    }
    this.styles = this.styles.concat([
      { title: 'Google', uri: {
        version: 8,
        sources: {
          'raster-tiles': {
            'type': 'raster',
            'tiles': [tileRoads],
            'tileSize': 256
          }
        },
        layers: [
          {
            'id': 'simple-tiles',
            'type': 'raster',
            'source': 'raster-tiles',
            'minzoom': 0,
            'maxzoom': 22
          }
        ],
        glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf'
      }},
      { title: 'Google Satellite', uri: {
        version: 8,
        sources: {
          'raster-tiles': {
            'type': 'raster',
            'tiles': [tileSatellite],
            'tileSize': 256
          }
        },
        layers: [
          {
            'id': 'simple-tiles',
            'type': 'raster',
            'source': 'raster-tiles',
            'minzoom': 0,
            'maxzoom': 22
          }
        ],
        glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf'
      }}
    ])
    document.addEventListener('click', event => {
      if (this.$refs.controlContainer.contains(event.target)) {
        this.btnVisible = true
        this.containerVisible = false
      }
    })
  },
  methods: {
    toggleGeofences() {
      vm.$store.dispatch('map/toggleGeofences')
    },
    toggleLineGeofences() {
      vm.$store.dispatch('map/toggleLineGeofences')
    },
    togglePOIs() {
      vm.$store.dispatch('map/togglePOIs')
    },
    async toggleBuildings() {
      await vm.$store.dispatch('map/toggleBuildings')
    },
    btnClick() {
      this.btnVisible = false
      this.containerVisible = true
    },
    styleClicked(title) {
      const style = this.styles.find(e => e.title === title).uri
      this.$store.dispatch('map/setType', title)
      this.$store.dispatch('map/setStyle', style)
      this.containerVisible = false
      this.btnVisible = true
      vm.$static.map.setStyle(style)
    }
  }
}
</script>

<style scoped>
  .mapboxgl-style-list
  {
    display: block;
  }

  .mapboxgl-style-list button
  {
    background: none;
    border: none;
    cursor: pointer;
    display: block;
    font-size: 14px;
    padding: 8px 8px 6px;
    text-align: right;
    width: 100%;
  }

  /* ignore warning */
  .mapboxgl-style-list button.active
  {
    font-weight: bold;
  }

  .mapboxgl-style-list button:hover
  {
    background-color: rgba(0, 0, 0, 0.05);
  }

  .mapboxgl-style-list button + button
  {
    border-top: 1px solid #ddd;
  }

  .mapboxgl-style-switcher
  {
    background-image: url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/PjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+PHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJDYXBhXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IiB3aWR0aD0iNTQuODQ5cHgiIGhlaWdodD0iNTQuODQ5cHgiIHZpZXdCb3g9IjAgMCA1NC44NDkgNTQuODQ5IiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA1NC44NDkgNTQuODQ5OyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+PGc+PGc+PGc+PHBhdGggZD0iTTU0LjQ5NywzOS42MTRsLTEwLjM2My00LjQ5bC0xNC45MTcsNS45NjhjLTAuNTM3LDAuMjE0LTEuMTY1LDAuMzE5LTEuNzkzLDAuMzE5Yy0wLjYyNywwLTEuMjU0LTAuMTA0LTEuNzktMC4zMThsLTE0LjkyMS01Ljk2OEwwLjM1MSwzOS42MTRjLTAuNDcyLDAuMjAzLTAuNDY3LDAuNTI0LDAuMDEsMC43MTZMMjYuNTYsNTAuODFjMC40NzcsMC4xOTEsMS4yNTEsMC4xOTEsMS43MjksMEw1NC40ODgsNDAuMzNDNTQuOTY0LDQwLjEzOSw1NC45NjksMzkuODE3LDU0LjQ5NywzOS42MTR6Ii8+PHBhdGggZD0iTTU0LjQ5NywyNy41MTJsLTEwLjM2NC00LjQ5MWwtMTQuOTE2LDUuOTY2Yy0wLjUzNiwwLjIxNS0xLjE2NSwwLjMyMS0xLjc5MiwwLjMyMWMtMC42MjgsMC0xLjI1Ni0wLjEwNi0xLjc5My0wLjMyMWwtMTQuOTE4LTUuOTY2TDAuMzUxLDI3LjUxMmMtMC40NzIsMC4yMDMtMC40NjcsMC41MjMsMC4wMSwwLjcxNkwyNi41NiwzOC43MDZjMC40NzcsMC4xOSwxLjI1MSwwLjE5LDEuNzI5LDBsMjYuMTk5LTEwLjQ3OUM1NC45NjQsMjguMDM2LDU0Ljk2OSwyNy43MTYsNTQuNDk3LDI3LjUxMnoiLz48cGF0aCBkPSJNMC4zNjEsMTYuMTI1bDEzLjY2Miw1LjQ2NWwxMi41MzcsNS4wMTVjMC40NzcsMC4xOTEsMS4yNTEsMC4xOTEsMS43MjksMGwxMi41NDEtNS4wMTZsMTMuNjU4LTUuNDYzYzAuNDc3LTAuMTkxLDAuNDgtMC41MTEsMC4wMS0wLjcxNkwyOC4yNzcsNC4wNDhjLTAuNDcxLTAuMjA0LTEuMjM2LTAuMjA0LTEuNzA4LDBMMC4zNTEsMTUuNDFDLTAuMTIxLDE1LjYxNC0wLjExNiwxNS45MzUsMC4zNjEsMTYuMTI1eiIvPjwvZz48L2c+PC9nPjxnPjwvZz48Zz48L2c+PGc+PC9nPjxnPjwvZz48Zz48L2c+PGc+PC9nPjxnPjwvZz48Zz48L2c+PGc+PC9nPjxnPjwvZz48Zz48L2c+PGc+PC9nPjxnPjwvZz48Zz48L2c+PGc+PC9nPjwvc3ZnPg==);
    background-position: center;
    background-repeat: no-repeat;
    background-size: 70%;
  }

  @media only screen and (max-width: 768px) {
    .mapboxgl-style-list button
    {
      font-size: 24px;
      padding-top: 5px;
      padding-bottom: 26px;
    }
  }

</style>
