<template>
  <f7-page>
    <f7-navbar :title="$t('route.alerts')"></f7-navbar>
    <f7-list media-list>
      <f7-list-item
        v-for="(item, index) in events"
        :key="index"
        :link="'/alertDetail/' + index"
        :title="item.title"
        :after="item.timestamp | moment('calendar')"
        :subtitle="item.type"
      />
    </f7-list>
  </f7-page>
</template>

<script>
import { mapGetters } from 'vuex'
import { serverBus } from '../../../main'

export default {
  computed: {
    ...mapGetters(['events', 'alerts'])
  },
  created() {
    serverBus.$on('eventsActive', this.pageShown)
    this.$store.dispatch('user/fetchEvents',
      {
        start: this.$moment().subtract(1, 'day').toDate(),
        end: new Date(),
        types: this.alerts
      })
      .then(() => {
        this.$log.info('alerts', this.events)
      })
  },
  methods: {
    pageShown() {
      this.$log.info('alerts', this.events)
      this.$store.dispatch('resetUnreadItems')
    }
  }
}
</script>
