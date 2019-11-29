<template>
  <section class="app-main" :style="$route.path.includes('map')?'':'padding-top:40px'">
    <transition name="fade-transform" mode="out-in">
      <keep-alive>
        <router-view :key="key" />
      </keep-alive>
    </transition>
  </section>
</template>

<script>
export default {
  name: 'AppMain',
  computed: {
    key() {
      return this.$route.path
    }
  },
  created() {
    this.$log.debug('appmain')
  }
}
</script>

