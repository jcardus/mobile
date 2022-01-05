<template>
  <div>
    <img style="width:100%; margin-top: 13px; margin-bottom: 0" :src="imageUrl" alt="" />
    <div style="width:100%; float:right">
      <el-tooltip id="coordsTooltip" class="item" effect="light" placement="bottom">
        <div slot="content">{{ lngLat[1].toFixed(6) }}<br />{{ lngLat[0].toFixed(6) }}</div>
        <i class="fas fa-globe coordsIcon" @click="copy()"></i>
      </el-tooltip>
    </div>
    <div class="content">
      <div class="title">
        <i :class="properties.icon" :style="'color: '+properties.color" /> {{ properties.description }}
      </div>
      <div class="subtitle">
        {{ properties.device }}
      </div>
      <div class="subtitle">
        {{ properties.content }}
      </div>
      <div style="padding-top: 5px;padding-bottom: 5px;">
        <span>{{ new Date(properties.timestamp).toLocaleString() }}</span>
      </div>
    </div>
  </div>
</template>

<script>

import Vue from 'vue'

export default {
  name: 'EventPopUp',
  data: function() {
    return {
      imageUrl: ''
    }
  },
  mounted() {
    const lat = this.lngLat[1].toFixed(6)
    const lon = this.lngLat[0].toFixed(6)
    const ll = `${lat},${lon}`
    const start = (this.isMobile && this.$device.ios) ? 'maps' : 'https'
    this.navigateUrl = `${start}://maps.google.com/maps?daddr=${ll}`
  },
  beforeDestroy() {
    Vue.$log.debug('destroying EventPopUp', this.properties)
  }
}
</script>

<style lang="scss" scoped>
@import '../../styles/element-variables.scss';

@font-face {
  font-family: 'AmazonEmberLight';
  src: url('https://d2alv66jwtleln.cloudfront.net/fonts/AmazonEmber_Lt.woff2') format('woff2'), url('https://d2alv66jwtleln.cloudfront.net/fonts/AmazonEmber_Lt.woff') format('woff');
}

@font-face {
  font-family: 'AmazonEmber';
  src: url('https://d2alv66jwtleln.cloudfront.net/fonts/AmazonEmber_Rg.woff2') format('woff2'), url('https://d2alv66jwtleln.cloudfront.net/fonts/AmazonEmber_Rg.woff') format('woff');
}

@font-face {
  font-family: 'AmazonEmberBold';
  src: url('https://d2alv66jwtleln.cloudfront.net/fonts/AmazonEmber_Bd.woff2') format('woff2'), url('https://d2alv66jwtleln.cloudfront.net/fonts/AmazonEmber_Bd.woff') format('woff');
}
.content {
  font-family: AmazonEmber,serif;
  padding-left: 6px;
  padding-right: 6px;
}
.title {
  font-style: normal;
  font-weight: bold;
  font-size: 16px;
  color: #32325D;
  padding-bottom: 2px;
  padding-top: 1px;
  overflow: auto;
}
.subtitle {
  font-style: normal;
  font-weight: normal;
  font-size: 12px;
  color: #32325D;
  padding-bottom: 8px;
  overflow: auto;
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
