<template>
  <div>
    <img style="width:100%; margin-top: 13px; margin-bottom: 0" :src="imageUrl" alt="" />
    <div class="left">
      {{ properties.title }}
    </div>
    <div class="right">
      <a href="" @click="navigateTo">navegar</a>
    </div>
  </div>
</template>

<script>
import Vue from 'vue'
import { getImage } from '../../utils/mapillary'

export default {
  name: 'PoiPopUp',
  data: function() {
    return {
      imageUrl: ''
    }
  },
  created() {
    getImage(this.lngLat).then((url) => {
      this.imageUrl = url
    })
  },
  beforeDestroy() {
    Vue.$log.debug('destroying PoiPopUp', this.properties)
  },
  methods: {
    navigateTo() {
      const lat = this.lngLat[1].toFixed(6)
      const lon = this.lngLat[0].toFixed(6)
      const ll = `${lat},${lon}`
      const start = (this.$device && this.$device.ios) ? 'maps' : 'https'
      window.open(`${start}://maps.google.com/maps?daddr=${ll}`)
    }
  }
}
</script>

<style scoped>
  .left {
    padding:10px;
    float: left;
    font-weight: bold;
    font-size: 22px;
    color: #32325D;
  }
  .right {
    padding:10px;
    float: right;
  }
</style>
