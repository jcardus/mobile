<template>
  <el-table />
</template>

<script>
import { traccar } from '../../api/traccar-api'

export default {
  name: 'Geofences',
  data: function() {
    return {
      geofences: null
    }
  },
  created() {
    const self = this
    traccar.geofences()
      .then(response => {
        self.geofences = response.data
      })
  }
}
</script>

<style scoped>

</style>
