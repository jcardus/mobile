<template>
  <f7-page name="Geofences">
    <f7-navbar back-link="">
      <i class="fas fa-draw-polygon" style="padding-right: 10px"></i>{{ $t('settings.geofences') }}
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
        v-for="item in geofences.filter(g => g && (g.area.startsWith('POLYGON') || g.area.startsWith('LINESTRING')))"
        :key="item.id"
        media-item
        swipeout
        :title="item.name"
        @swipeout:deleted="onGeofenceDelete(item.id)"
      >
        <f7-swipeout-actions right>
          <f7-swipeout-button color="blue" @click="onGeofenceEdit(item)">{{ $t('geofence.edit_geofence') }}</f7-swipeout-button>
          <f7-swipeout-button delete :confirm-title="$t('geofence.geofence_delete_title')" :confirm-text="$t('geofence.geofence_delete_info') + item.name">{{ $t('geofence.delete_geofence') }}</f7-swipeout-button>
        </f7-swipeout-actions>
      </f7-list-item>
    </f7-list>
  </f7-page>
</template>

<script>
import { mapGetters } from 'vuex'
import { vm } from '../../../main'
import { traccar } from '../../../api/traccar-api'
import * as lnglat from '../../../utils/lnglat'

export default {
  name: 'Geofences',
  data() {
    return {
      selectedGeofence: null
    }
  },
  computed: {
    ...mapGetters(['geofences']),
    geofencesSource() { return this.$root.$static.geofencesSource }
  },
  methods: {
    onGeofenceDelete(poiId) {
      traccar.deleteGeofence(poiId, this.geofenceDeleted)
    },
    onGeofenceEdit(geofence) {
      this.selectedGeofence = geofence
      this.$f7.dialog.prompt(this.$t('geofence.geofence_edit_name'), this.$t('geofence.geofence_edit_title'),
        this.editGeofence,
        this.cancelEdit,
        geofence.name
      )
    },
    editGeofence(value) {
      traccar.editGeofence(this.selectedGeofence.id, this.selectedGeofence, this.geofenceEdited())
      this.selectedGeofence.name = value
    },
    cancelEdit(value) {
      this.selectedGeofence = null
    },
    geofenceEdited: function() {
      this.$f7.dialog.alert(this.$t('geofence.geofence_edited'), this.$t('geofence.geofence_edit_title'))
    },
    geofenceDeleted(geofenceId) {
      vm.$store.state.user.geofences = vm.$store.state.user.geofences.filter((e) => e && e.id !== geofenceId)
      this.geofencesSource.features = this.geofencesSource.features.filter((e) => e.properties.id !== geofenceId)
      lnglat.refreshGeofences()
      this.$f7.dialog.alert(this.$t('geofence.geofence_deleted'), this.$t('geofence.geofence_delete_title'))
    }
  }
}
</script>
