<template>
  <f7-page name="AlertDetail">
    <f7-navbar back-link="" :title="$t('route.alerts')"></f7-navbar>
    <f7-block-title>{{ events[alertId].title }}</f7-block-title>
    <f7-block>
      <f7-list v-if="alert">
        <f7-list-item :title="alert.type" :after="events[alertId].timestamp | moment('LLLL')" />
      </f7-list>
      <div style="height: 500px">
        <simple-map
          :position="position"
        />
      </div>
    </f7-block>
  </f7-page>
</template>

<script>
import { mapGetters } from 'vuex'
import SimpleMap from '../../../views/map/SimpleMap'
import { traccar } from '../../../api/traccar-api'

export default {
  name: 'AlertDetail',
  components: { SimpleMap },
  data() {
    return {
      alertId: 0,
      positionId: 0,
      position: null,
      alert: null
    }
  },
  computed: {
    ...mapGetters(['events'])
  },
  mounted() {
    this.alertId = parseInt(this.$f7route.params.alertId)
    this.alert = this.events[this.alertId]
    this.positionId = this.alert.positionId
    traccar.positions(null, this.positionId).then((position) => {
      this.position = position[0]
    })
  }
}
</script>

<style scoped>

</style>
