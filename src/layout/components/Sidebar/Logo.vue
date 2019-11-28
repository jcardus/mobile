<template>
  <transition name="sidebarLogoFade">
    <div class="divLogo">
      <img :src="logoImage" class="sidebar-logo" alt="">
    </div>
  </transition>
</template>

<script>
import * as partner from '@/utils/partner'

export default {
  name: 'SidebarLogo',
  props: {
    collapse: {
      type: Boolean,
      required: true
    }
  },
  computed: {
    logoImage: function() {
      return partner.getFavIcon()
    },
    title: function() {
      return partner.getTitle()
    }
  }
}
</script>

<style lang="scss" scoped>

.sidebarLogoFade-enter-active {
  transition: opacity 1.5s;
}
.sidebarLogoFade-enter,
.sidebarLogoFade-leave-to {
  opacity: 0;
}
.sidebar-logo {
  padding-top: 10px;
  width: 32px;
  height: 42px;
}

.divLogo {
  display: block;
  margin-left: auto;
  margin-right: auto;
  width: 50%;
}

</style>
