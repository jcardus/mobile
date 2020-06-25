<template>
  <div class="mapboxgl-ctrl mapboxgl-ctrl-group">
    <button v-show="btnVisible" class="mapboxgl-ctrl-icon mapboxgl-style-switcher" @click="btnClick"></button>
    <div v-show="containerVisible" ref="controlContainer" class="mapboxgl-style-list">
      <button
        v-for="style in styles"
        :key="style.title"
        :class="style.title === selected?'active':''"
        @click="styleClicked(style.title)"
      >
        {{ style.title }}
      </button>
      <button :class="geofencesVisible?'active':''" @click="toggleGeofences">Geofences</button>
      <button :class="lineGeofencesVisible?'active':''" @click="toggleLineGeofences">Line</button>
      <button :class="poisVisible?'active':''" @click="togglePOIs">POIs</button>
      <button :class="buildingsVisible?'active':''" @click="toggleBuildings">3D Buildings</button>
    </div>
  </div>
</template>

<script>

import { vm } from '../../../../main'

export default {
  name: 'StyleSwitcherControl',
  data: function() {
    return {
      btnVisible: true,
      containerVisible: false,
      selected: 'Streets',
      styles: [
        { title: 'Dark', uri: 'mapbox://styles/mapbox/dark-v10' },
        { title: 'Light', uri: 'mapbox://styles/mapbox/light-v9' },
        { title: 'Outdoors', uri: 'mapbox://styles/mapbox/outdoors-v11' },
        { title: 'Satellite', uri: 'mapbox://styles/mapbox/satellite-streets-v11' },
        { title: 'Streets', uri: 'mapbox://styles/mapbox/streets-v11' }
      ]
    }
  },
  computed: {
    map: function() { return vm.$static.map },
    geofencesVisible: function() { return vm.$store.state.map.showGeofences },
    lineGeofencesVisible: function() { return vm.$store.state.map.showLineGeofences },
    poisVisible: function() { return vm.$store.state.map.showPOIs },
    buildingsVisible() { return vm.$store.state.map.show3dBuildings }
  },
  mounted: function() {
    document.addEventListener('click', event => {
      if (this.$refs.controlContainer.contains(event.target)) {
        this.btnVisible = true
        this.containerVisible = false
      }
    })
  },
  methods: {
    toggleGeofences: function() {
      vm.$store.dispatch('map/toggleGeofences')
    },
    toggleLineGeofences: function() {
      vm.$store.dispatch('map/toggleLineGeofences')
    },
    togglePOIs: function() {
      vm.$store.dispatch('map/togglePOIs')
    },
    async toggleBuildings() {
      await vm.$store.dispatch('map/toggleBuildings')
    },
    btnClick: function() {
      this.btnVisible = false
      this.containerVisible = true
    },
    styleClicked: function(title) {
      vm.$static.map.setStyle(this.styles.find(e => e.title === title).uri)
      this.selected = title
      this.containerVisible = false
      this.btnVisible = true
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
