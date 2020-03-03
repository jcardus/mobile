<template>
  <f7-page name="Vehicles">
    <f7-navbar back-link :title="$t('route.settings')"></f7-navbar>
    <f7-block-title style="font-size: 20px"><i class="fas fa-car-alt"></i> {{ $t('settings.vehicles') }}</f7-block-title>
    <f7-list
      media-list
      virtual-list
    >
      <ul>
        <f7-list-item
          v-for="item in devices"
          :key="item.id"
          :title="item.name"
          :link="'/settings/vehicleDetails/' + item.id"
          :subtitle="item.attributes.license_plate"
          :after="groupName(item.groupId)"
        >
        </f7-list-item>
      </ul>
    </f7-list>
  </f7-page>
</template>

<script>
import { vm } from '../../../main'

export default {
  name: 'Vehicles',
  computed: {
    devices: function() {
      return vm.$data.devices
    }
  },
  methods: {
    groupName: function(groupId) {
      if (groupId) {
        const group = vm.$data.groups.find((g) => g.id === groupId)
        return group && group.name
      } else {
        return ''
      }
    }
  }
}
</script>
