<template>
  <f7-page>
    <f7-navbar :title="$t('route.alerts')"></f7-navbar>
    <f7-list media-list>
      <f7-list-item
        v-for="item in events"
        :key="item.id"
        link="#"
        :title="item.type"
        :after="item.serverTime | moment('calendar')"
        :subtitle="item.serverTime"
        :text="item.device.groupName"
      />
    </f7-list>
  </f7-page>
</template>

<script>
import { mapGetters } from 'vuex'
import { serverBus } from '../../main'

export default {
  computed: {
    ...mapGetters(['events'])
  },
  created() {
    serverBus.$on('eventsActive', this.pageShown)
  },
  methods: {
    pageShown() {
      this.$log.info('alerts', this.events)
      if (this.events.length === 0) {
        this.$store.dispatch('user/fetchEvents').then(() => {
          this.$log.info('alerts', this.events)
        })
      }
    }
  }
}
</script>
