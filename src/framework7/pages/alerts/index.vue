<template>
  <f7-page>
    <f7-navbar :title="$t('route.alerts')">
      <f7-nav-right>
        <f7-link class="searchbar-enable" icon-ios="f7:search" icon-aurora="f7:search" icon-md="material:search"></f7-link>
      </f7-nav-right>
      <f7-searchbar
        expandable
        :placeholder="$t('settings.search')"
        search-container=".search-list"
        search-in=".item-title,.item-subtitle"
        :disable-button="!$theme.aurora"
      ></f7-searchbar>
    </f7-navbar>
    <f7-list class="searchbar-not-found">
      <f7-list-item :title="$t('settings.empty_list')"></f7-list-item>
    </f7-list>
    <f7-list
      class="search-list searchbar-found"
      media-list
      inset
    >
      <f7-list-item
        v-for="(item, index) in events"
        :key="index"
        :link="'/alertDetail/' + index"
        :title="item && item.device && item.device.name"
        :after="item && item.serverTime && new Date(item.serverTime).toLocaleString()"
        :subtitle="item.description"
      />
    </f7-list>
  </f7-page>
</template>

<script>
import { mapGetters } from 'vuex'
import { serverBus } from '@/main'
import * as alertType from '@/alerts/alertType'

export default {
  data() {
    return {}
  },
  computed: {
    ...mapGetters(['events', 'alerts']),
    userAlertTypes() {
      return alertType.alertTypes.filter(a => this.alerts.map(a => this.getAlertType(a)).includes(a))
    }
  },
  created() {
    serverBus.$on('eventsActive', this.pageShown)
  },
  methods: {
    pageShown() {
      console.log(this.userAlertTypes)

      this.$store.dispatch('resetUnreadItems')
      this.$store.dispatch('transient/fetchEvents', {
        start: new Date(new Date().setHours(-2)),
        end: new Date(),
        types: [...new Set(this.userAlertTypes.map(t => alertType.customAlarmTypes.includes(t) ? 'alarm' : t))]
      })
    },
    getAlertType(item) {
      if (item.notification.type === 'alarm') {
        return item.notification.attributes.alarms
      } else {
        return item.notification.type
      }
    }
  }
}
</script>
