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
  },
  methods: {
    pageShown() {
      this.$store.dispatch('resetUnreadItems')
    }
  }
}
</script>
