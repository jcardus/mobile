<template>
  <f7-page name="AlertDetail">
    <f7-navbar back-link :title="$t('route.alerts')"></f7-navbar>
    <f7-block-title>{{ events[alertId].title }}</f7-block-title>
    <f7-block>
      <f7-row>
        <f7-col width="40">
          {{ events[alertId].type }}
        </f7-col>
        <f7-col width="60">
          {{ events[alertId].timestamp | moment('LLLL') }}
        </f7-col>
      </f7-row>
      <div style="height: 500px">
        <simple-map
          center=""
        />
      </div>
    </f7-block>
  </f7-page>
</template>

<script>
import { mapGetters } from 'vuex'
import SimpleMap from '../../../views/map/SimpleMap'

export default {
  name: 'AlertDetail',
  components: { SimpleMap },
  data() {
    return {
      alertId: 0
    }
  },
  computed: {
    ...mapGetters(['events'])
  },
  mounted() {
    this.alertId = parseInt(this.$f7route.params.alertId)
  }
}
</script>

<style scoped>

</style>
