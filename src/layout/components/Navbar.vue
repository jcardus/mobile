<template>
  <div v-if="showNavBar" class="navbar">
    <div class="left">
      <span>{{ title }}</span>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import * as lnglat from '../../utils/lnglat'
import Vue from 'vue'

export default {
  created() {
    Vue.$log.debug('Navbar created')
  },
  mounted() {
    Vue.$log.debug('Navbar mounted')
  },
  // eslint-disable-next-line vue/order-in-components
  computed: {
    showNavBar() {
      return !this.$route.path.includes('map') &&
        !this.$route.path.includes('dashboard')
    },
    ...mapGetters([
      'sidebar',
      'avatar',
      'device'
    ]),
    title() {
      return this.$t(this.$route.meta.title)
    },
    isMobile() {
      return lnglat.isMobile()
    }
  }
}
</script>

<style lang="scss" scoped>
  @import '../../styles/element-variables.scss';
  .navbar {
    height: 50px;
    width: calc(100vw - 300px);
    position: absolute;
    left: 64px;
    background: rgba(0, 0, 0, 0);
    z-index: 99;
  }
  .left {
    padding: 10px;
    float: left;
    font-size: larger;
    //opacity: 0.5;
    font-weight: bold;
  }
</style>
