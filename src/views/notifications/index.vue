<template>
  <div class="app-container" :style="top">
    <timeline></timeline>
  </div>
</template>

<script>
import Timeline from './Timeline'

export default {
  name: 'Notifications',
  components: { Timeline },
  data() {
    return {
    }
  },
  computed: {
    top() {
      if (('standalone' in window.navigator) && window.navigator.standalone) {
        return 'padding-top:95px;'
      }
      return 'padding-top:60px;'
    }
  },
  created() {
  },
  methods: {
  }
}
</script>
<style scoped>
  .app-container {
    padding-right: 10px;
    padding-left: 10px;
  }
</style>
