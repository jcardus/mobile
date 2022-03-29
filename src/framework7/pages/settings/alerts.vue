<template>
  <f7-page name="Alerts">
    <f7-navbar back-link="">
      <i class="fas fa-bell" style="padding-right: 10px"></i>{{ $t('settings.alerts') }}
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
        v-for="item in alerts"
        :key="item.id"
        :title="$t('settings.alert_' + item.notification.type)"
        :subtitle="item.notification.notificators"
        :after="item.notification.always ? $t('settings.allVehicles') : `${item.devices.length} ${$t('settings.vehicle')}(s)`"
      />
    </f7-list>
  </f7-page>
</template>
<script>
import { mapGetters } from 'vuex'

export default {
  computed: {
    ...mapGetters(['alerts'])
  }
}

</script>
