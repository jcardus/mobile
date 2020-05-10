<template>
  <f7-page name="Geofences">
    <f7-navbar back-link="">
      <i class="fas fa-map-marked" style="padding-right: 10px"></i>{{ $t('settings.zone') }}
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
        v-for="item in geofences"
        :key="item.id"
        media-item
        swipeout
        :title="item.name"
        @swipeout:deleted="onGeofenceDelete(item.id)"
      >
        <div slot="media" style="width:30px">
          <i v-if="!(getType(item)==='poi')" slot="media" :style="'color: '+(item.attributes.color ? item.attributes.color : '#3232b4')" :class="geofenceImageType(item)"></i>
          <img v-if="getType(item)==='poi'" slot="media" :src="'img/icons/pois/' +(item.attributes.icon ? item.attributes.icon : 'marker')+'-blue.svg'">
        </div>
        <f7-swipeout-actions right>
          <f7-swipeout-button color="blue" @click="onGeofenceEdit(item)">{{ $t('geofence.edit_geofence') }}</f7-swipeout-button>
          <f7-swipeout-button delete :confirm-title="$t('geofence.'+getType(item)+'_delete_title')" :confirm-text="$t('geofence.'+getType(item)+'_delete_info') + item.name">{{ $t('geofence.delete_geofence') }}</f7-swipeout-button>
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
      this.$f7.dialog.prompt(this.$t('geofence.' + this.getType(geofence) + '_edit_name'), this.$t('geofence.' + this.getType(geofence) + '_edit_title'),
        this.editGeofence,
        this.cancelEdit,
        geofence.name
      )
    },
    editGeofence(value) {
      traccar.editGeofence(this.selectedGeofence.id, this.selectedGeofence, this.geofenceEdited)
      this.selectedGeofence.name = value
    },
    cancelEdit(value) {
      this.selectedGeofence = null
    },
    geofenceEdited: function(geofence) {
      this.$f7.dialog.alert(this.$t('geofence.' + this.getType(geofence) + '_edited'), this.$t('geofence.' + this.getType(geofence) + '_edit_title'))
    },
    geofenceDeleted(geofenceId) {
      const type = this.getType(vm.$store.state.user.geofences.find(e => e.id !== geofenceId))
      vm.$store.state.user.geofences = vm.$store.state.user.geofences.filter((e) => e && e.id !== geofenceId)
      this.geofencesSource.features = this.geofencesSource.features.filter((e) => e.properties.id !== geofenceId)
      lnglat.refreshGeofences()
      this.$f7.dialog.alert(this.$t('geofence.' + type + '_deleted'), this.$t('geofence.' + type + '_delete_title'))
    },
    getType(row) {
      return row.area.startsWith('POLYGON') ? 'geofence' : (row.area.startsWith('LINESTRING') ? 'linegeofence' : 'poi')
    },
    geofenceImageType(row) {
      return row.area.startsWith('CIRCLE') ? 'fas fa-map-marker-alt' : (row.area.startsWith('LINE') ? 'iconGeofence fas fa-wave-square' : 'iconGeofence fas fa-draw-polygon')
    }
  }
}
</script>
