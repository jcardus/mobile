<template>
  <div>
    <div v-if="!$route.path.includes('map') && !$route.path.includes('dashboard')" style="height: 50px"></div>
    <transition name="fade-transform" mode="out-in">
      <keep-alive>
        <router-view :key="key" />
      </keep-alive>
    </transition>
  </div>
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
<style>

</style>

