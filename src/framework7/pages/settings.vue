<template>
  <f7-page name="settings">
    <f7-navbar :title="$t('route.settings')"></f7-navbar>
    <f7-block inset>
      <f7-row tag="p">
        <f7-col>
          <f7-button fill large raised style="font-size:15px" href="/settings/vehicles"><i class="fas fa-car-alt"></i> {{ $t('settings.vehicles') }}</f7-button>
        </f7-col>
        <f7-col>
          <f7-button fill large raised style="font-size:15px" href="/settings/pois"><i class="fas fa-map-marker-alt"></i> {{ $t('settings.pois') }}</f7-button>
        </f7-col>
      </f7-row>
      <!-- <f7-row tag="p">
        <f7-col>
          <f7-button fill large raised style="font-size:20px" href="/settings/geofences"><i class="fas fa-draw-polygon"></i> Geofences</f7-button>
        </f7-col>
        <f7-col>
          <f7-button fill large raised style="font-size:20px" href="/settings/alerts"><i class="fas fa-bell"></i> Alerts</f7-button>
        </f7-col>
      </f7-row>-->
      <f7-row tag="p">
        <f7-col>
          <f7-button fill large raised style="font-size:15px" href="/settings/map"><i class="fas fa-map"></i> {{ $t('settings.map') }}</f7-button>
        </f7-col>
        <f7-col>
          <f7-button fill large raised style="font-size:15px" href="/settings/about"><i class="fas fa-info-circle"></i> {{ $t('settings.about') }}</f7-button>
        </f7-col>
      </f7-row>
      <f7-row tag="p">
        <f7-col>
          <f7-button fill large raised style="font-size:15px" @click="refreshApp"><i class="fas fa-redo"></i> {{ $t('settings.refresh') }}</f7-button>
        </f7-col>
        <f7-col>
          <f7-button fill large raised style="font-size:15px" @click="logout"><i class="fas fa-sign-out-alt"></i> {{ $t('settings.logout') }}</f7-button>
        </f7-col>
      </f7-row>
    </f7-block>
  </f7-page>
</template>
<script>

import { appOffline } from '../../utils/utils'

export default {
  name: 'Settings',
  computed: {
    lastUpdate() {
      return this.$moment(this.$store.state.lastUpdate)
    },
    offline() {
      return appOffline()
    },
    connected() {
      return this.offline ? this.$t('settings.disconnected') : this.$t('settings.connected')
    }
  },
  methods: {
    refreshApp() {
      this.$log.debug('refreshing...')
      this.$f7.preloader.show()
      location.reload()
    },
    logout() {
      this.$f7.preloader.show()
      this.$store.dispatch('user/logout').then(
        () => {
        },
        () => {
        }
      ).finally(() => {
        // this.$f7.preloader.hide()
        // this.$f7.loginScreen.open('#loginScreen', false)
        location.reload()
      })
    }
  }
}
</script>
