<template>
  <f7-page name="Vehicles" @pageAfterIn="pageAfterIn">
    <f7-navbar back-link>
      <i class="fas fa-car-alt" style="padding-right: 10px"></i>{{ $t('settings.vehicles') }}
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
      <ul>
        <f7-list-item
          v-for="item in devices"
          :key="item.id"
          :title="item.name"
          :link="'/settings/vehicleDetails/' + item.id"
          :subtitle="item.attributes.license_plate"
          :after="groupName(item.groupId)"
          :text="item.attributes.monitrip ? `Viagem iniciada (${item.attributes.notes})` : ''"
        >
        </f7-list-item>
      </ul>
    </f7-list>
  </f7-page>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'Vehicles',
  computed: {
    ...mapGetters(['groups', 'devices'])
  },
  methods: {
    groupName(groupId) {
      if (groupId) {
        const group = this.groups.find(g => g.id === groupId)
        return group && group.name
      } else {
        return ''
      }
    },
    pageAfterIn() {
      this.$store.dispatch('user/setDevices')
    }
  }
}
</script>
