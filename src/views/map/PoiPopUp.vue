<template>
  <div>
    <img style="width:100%; margin-top: 13px; margin-bottom: 0" :src="imageUrl" alt="" />
    <div class="left">
      {{ properties.title }}
    </div>
    <div class="right">
      <f7-link v-if="isMobile" href="#" @click="navigateTo">Navegar</f7-link>
      <el-link v-else :href="navigateUrl" target="_blank">Navegar</el-link>
    </div>
  </div>
</template>

<script>
import Vue from 'vue'
import { getImage } from '../../utils/mapillary'
import * as lnglat from '../../utils/lnglat'

export default {
  name: 'PoiPopUp',
  data: function() {
    return {
      imageUrl: '',
      navigateUrl: ''
    }
  },
  computed: {
    isMobile() {
      return lnglat.isMobile()
    }
  },
  mounted() {
    getImage(this.lngLat).then((url) => {
      this.imageUrl = url
    })
    const lat = this.lngLat[1].toFixed(6)
    const lon = this.lngLat[0].toFixed(6)
    const ll = `${lat},${lon}`
    const start = (this.isMobile && this.$device.ios) ? 'maps' : 'https'
    this.navigateUrl = `${start}://maps.google.com/maps?daddr=${ll}`
  },
  beforeDestroy() {
    Vue.$log.debug('destroying PoiPopUp', this.properties)
  },
  methods: {
    navigateTo() {
      const win = window.open(this.navigateUrl, '_top')
      return win.focus()
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
