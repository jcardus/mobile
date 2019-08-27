<template>
  <div />
</template>

<script>
import { vm } from '../../main'
import { traccar } from '../../api/traccar-api'

export default {
  created() {
    traccar.devices(function(response) {
      vm.$log.debug(response)
      vm.devices = response
    })
  }
}
</script>
