<template>
  <f7-page name="Vehicles">
    <f7-navbar back-link title="Configurações"></f7-navbar>
    <f7-block-title style="font-size: 20px"><i class="fas fa-car-alt"></i> Vehicles</f7-block-title>
    <f7-list
      media-list
      virtual-list
      :virtual-list-params="{ devices, renderExternal, height: $theme.ios ? 63 : ($theme.md ? 73 : 46)}"
    >
      <ul>
        <f7-list-item
          v-for="item in devices"
          :key="item.id"
          media-item
          link="/settings/vehicleDetails"
          :title="item.name"
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
      return vm.$data.devices.sort((a, b) => (a.name > b.name) ? 1 : -1)
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
