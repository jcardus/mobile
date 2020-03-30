<template>
  <f7-page name="POIs">
    <f7-navbar back-link>
      <i class="fas fa-map-marker" style="padding-right: 10px"></i> {{ $t('settings.pois_title') }}
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
          v-for="item in pois"
          :key="item.id"
          media-item
          swipeout
          :title="item.name"
          @swipeout:deleted="onPoiDelete(item.id)"
        >
          <f7-swipeout-actions right>
            <f7-swipeout-button color="blue" @click="onPoiEdit(item)">{{ $t('geofence.edit_geofence') }}</f7-swipeout-button>
            <f7-swipeout-button delete :confirm-title="$t('geofence.poi_delete_title')" :confirm-text="$t('geofence.poi_delete_info') + item.name">{{ $t('geofence.delete_geofence') }}</f7-swipeout-button>
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
      return vm.$store.state.user.geofences.filter(g => g && g.area.startsWith('CIRCLE'))
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
    cancelEdit() {
      this.selectedPoi = null
    },
    poiEdited: function() {
      this.$f7.dialog.alert(this.$t('geofence.poi_edited'), this.$t('geofence.poi_edit_title'))
    },
    geofenceDeleted(geofenceId) {
      vm.$store.state.user.geofences = vm.$store.state.user.geofences.filter((e) => e && e.id !== geofenceId)
      this.geofencesSource.features = this.geofencesSource.features.filter((e) => e.properties.id !== geofenceId)
      lnglat.refreshGeofences()
      this.$f7.dialog.alert(this.$t('geofence.poi_deleted'), this.$t('geofence.poi_delete_title'))
    }
  }
}
</script>
