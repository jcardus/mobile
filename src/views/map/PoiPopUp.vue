<template>
  <div>
    <img style="width:100%; margin-top: 13px; margin-bottom: 0" :src="imageUrl" alt="" />
    <div class="left">
      {{ properties.title }}
    </div>
    <div class="right">
      <p><a href="geo:50,10">Location 50/10</a></p>
      <p><a href="geo:Vienna">Location Vienna</a></p>
      <p><a href="geo:?z=5&q=New+York">Zoom 5, Search for New York</a></p>
      <p><a href="geo:?q=San+Francisco&z=15">Zoom 15, Search for San Francisco</a></p>
      <p><a href="google.navigation:q=San+Francisco">Navigation to San Francisco</a></p>
      <p><a href="google.navigation:q=50,10">Navigation to 50/10</a></p>
      <p><a href="http://maps.google.com/maps?saddr=New+York&daddr=San+Francisco">Route New York --> San Francisco</a></p>
      <p><a href="http://maps.google.com/maps?saddr=50,10&daddr=50,20">Route 50/10 --> 50/20</a></p>

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
