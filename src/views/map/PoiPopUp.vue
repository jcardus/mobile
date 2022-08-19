<template>
  <div>
    <img style="width:100%; margin-top: 13px; margin-bottom: 0" :src="imageUrl" alt="" />
    <div style="width:100%; float:right">
      <el-tooltip id="coordsTooltip" class="item" effect="light" placement="bottom">
        <div slot="content"></div>
        <i class="fas fa-street-view coordsIcon" @click="copy()"></i>
      </el-tooltip>
    </div>
    <div class="left">
      {{ properties.title }}
    </div>
    <div class="right">
      <f7-link v-if="isMobile" href="#" @click="navigateTo">Navegar</f7-link>
    </div>
    <div class="subtitle">
      {{ properties.description }}
    </div>
  </div>
</template>

<script>
import Vue from 'vue'
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
    const lat = this.lngLat[1].toFixed(6)
    const lon = this.lngLat[0].toFixed(6)
    const ll = `${lat},${lon}`
    const start = this.$device.ios ? 'maps' : 'https'
    this.navigateUrl = `${start}://maps.google.com/maps?daddr=${ll}`
  },
  beforeDestroy() {
    Vue.$log.debug('destroying PoiPopUp', this.properties)
  },
  methods: {
    navigateTo() {
      const win = window.open(this.navigateUrl, '_top')
      return win.focus()
    },
    copy() {
      const url = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${this.lngLat[1]},${this.lngLat[0]}`
      window.open(url)
    }
  }
}
</script>

<style lang="scss" scoped>
  @import '../../styles/element-variables.scss';

  .left {
    padding:10px;
    float: left;
    font-weight: bold;
    font-size: 20px;
    color: #32325D;
  }
  .subtitle {
    padding:10px;
    float: left;
    font-size: 16px;
    color: #32325D;
  }
  .right {
    padding:10px;
    float: right;
  }
  .coordsIcon{
    float: right;
    color: $--color-primary;
    padding-top: 15px;
    padding-right: 10px;
  }
</style>
