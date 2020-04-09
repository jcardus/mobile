<template>
  <f7-page name="Drivers">
    <f7-navbar back-link>
      <i class="fas fa-address-card" style="padding-right: 10px"></i> {{ $t('settings.drivers') }}
      <f7-nav-right>
        <f7-link class="searchbar-enable" icon-ios="f7:search" icon-aurora="f7:search" icon-md="material:search"></f7-link>
      </f7-nav-right>
      <f7-searchbar
        expandable
        :placeholder="$t('settings.search')"
        search-container=".search-list"
        search-in=".item-title"
        :disable-button="!$theme.aurora"
      ></f7-searchbar>
    </f7-navbar>
    <f7-fab slot="fixed" position="right-top" color="gray" @click="onDriverAdd">
      <f7-icon ios="f7:plus" aurora="f7:plus" md="material:add"></f7-icon>
      <f7-icon ios="f7:xmark" aurora="f7:xmark" md="material:close"></f7-icon>
    </f7-fab>
    <f7-list class="searchbar-not-found">
      <f7-list-item :title="$t('settings.empty_list')"></f7-list-item>
    </f7-list>
    <f7-list
      class="search-list searchbar-found"
      style="padding-top: 45px;"
      media-list
      inset
    >
      <ul>
        <f7-list-item
          v-for="item in drivers"
          :key="item.id"
          media-item
          swipeout
          :title="item.name"
          :after="item.attributes.phone"
          :text="item.attributes.email"
          :link="'/settings/driverDetails/' + item.id"
          @swipeout:deleted="onDriverDelete(item.id)"
        >
          <f7-swipeout-actions right>
            <f7-swipeout-button delete :confirm-title="$t('settings.driver_delete_title')" :confirm-text="$t('settings.driver_delete_info') + item.name">{{ $t('settings.delete') }}</f7-swipeout-button>
          </f7-swipeout-actions>
        </f7-list-item>
      </ul>
    </f7-list>
  </f7-page>
</template>

<script>
import { mapGetters } from 'vuex'
import { traccar } from '../../../api/traccar-api'
import { vm } from '../../../main'

export default {
  name: 'Drivers',
  data() {
    return {
    }
  },
  computed: {
    ...mapGetters(['drivers'])
  },
  methods: {
    onDriverDelete(driverId) {
      traccar.deleteDriver(driverId, this.driverDeleted)
    },
    driverDeleted: function(driverId) {
      vm.$store.state.user.drivers = vm.$store.state.user.drivers.filter((e) => e && e.id !== driverId)
      this.$f7.dialog.alert(this.$t('settings.driver_deleted'), this.$t('settings.driver_delete_title'))
    },
    onDriverAdd() {
      this.$f7router.navigate('/settings/driverDetails/' + -1)
    }
  }
}
</script>

<style scoped>

</style>
