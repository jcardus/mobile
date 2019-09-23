<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>

export default {
  name: 'App',
  watch: {
    $route(to, from) {
      switch (window.location.hostname) {
        case 'wuizy.co.ao':
          document.title = 'Wuizy'
          console.log('Wuizy')
          break
        default:
          document.title = 'Fleetrack'
          console.log('Fleetrack')
          break
      }
    }
  }
}
</script>
