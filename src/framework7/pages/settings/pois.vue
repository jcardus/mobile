<template>
  <f7-page name="POIs">
    <f7-navbar back-link :title="$t('route.settings')"></f7-navbar>
    <f7-block-title style="font-size: 20px"><i class="fas fa-map-marker"></i> POIs</f7-block-title>
    <f7-list
      media-list
      virtual-list
      :virtual-list-params="{ devices, renderExternal, height: $theme.ios ? 63 : ($theme.md ? 73 : 46)}"
    >
      <ul>
        <f7-list-item
          v-for="item in pois"
          :key="item.id"
          media-item
          swipeout
          :title="item.name"
          @swipeout:deleted="onPoiDelete(item.id)"
        >
          <f7-swipeout-actions right>
            <f7-swipeout-button color="green" @click="onPoiEdit(item)">Edit</f7-swipeout-button>
            <f7-swipeout-button delete :confirm-title="$t('geofence.poi_delete_title')" :confirm-text="$t('geofence.poi_delete_info') + item.name">Delete</f7-swipeout-button>
          </f7-swipeout-actions>
        </f7-list-item>
      </ul>
    </f7-list>
  </f7-page>
</template>

<script>
import { vm } from '../../../main'
import { traccar } from '../../../api/traccar-api'
import * as lnglat from '../../../utils/lnglat'

export default {
  name: 'POIs',
  data() {
    return {
      selectedPoi: null
    }
  },
  computed:
  {
    pois: function() {
      return vm.$data.geofences.filter(g => g && g.area.startsWith('CIRCLE'))
    },
    geofencesSource() { return this.$root.$static.geofencesSource }
  },
  methods: {
    onPoiDelete(poiId) {
      traccar.deleteGeofence(poiId, this.geofenceDeleted)
    },
    onPoiEdit(poi) {
      this.selectedPoi = poi
      this.$f7.dialog.prompt(this.$t('geofence.poi_edit_name'), this.$t('geofence.poi_edit_title'),
        this.editPoi,
        this.cancelEdit,
        poi.name
      )
    },
    editPoi(value) {
      traccar.editGeofence(this.selectedPoi.id, this.selectedPoi, this.poiEdited())
      this.selectedPoi.name = value
    },
    cancelEdit(value) {
      this.selectedPoi = null
    },
    poiEdited: function() {
      this.$f7.dialog.alert(this.$t('geofence.poi_edited'), this.$t('geofence.poi_edit_title'))
    },
    geofenceDeleted(geofenceId) {
      vm.$data.geofences = vm.$data.geofences.filter((e) => e && e.id !== geofenceId)
      this.geofencesSource.features = this.geofencesSource.features.filter((e) => e.properties.id !== geofenceId)
      lnglat.refreshGeofences()
      this.$f7.dialog.alert(this.$t('geofence.poi_deleted'), this.$t('geofence.poi_delete_title'))
    }
  }
}
</script>
