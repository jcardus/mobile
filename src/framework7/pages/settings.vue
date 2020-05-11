<template>
  <f7-page name="settings">
    <f7-navbar :title="$t('route.settings')"></f7-navbar>
    <f7-block inset>
      <f7-row>
        <f7-col>
          <f7-button class="elevation-10" fill large raised style="text-transform: none; padding-top:30px; line-height: normal; height: 120px; width: 120px" href="/settings/vehicles">
            <div style="padding-bottom: 5px"><i style="font-size: 40px" class="fas fa-car-alt"></i></div>
            <div style="font-size:10px; height: 10px">{{ $t('settings.vehicles') }}</div>
          </f7-button>
        </f7-col>
        <f7-col>
          <f7-button class="elevation-10" fill large raised style="text-transform: none; padding-top:30px; line-height: normal; height: 120px; width: 120px" href="/settings/geofences">
            <div style="padding-bottom: 5px"><i style="font-size: 40px" class="fas fa-map-marked"></i></div>
            <div style="font-size:10px; height: 10px">{{ $t('settings.zone') }}</div></f7-button>
        </f7-col>
      </f7-row>
      <f7-row>
        <f7-col>
          <f7-button class="elevation-10" fill large raised style="text-transform: none; padding-top:30px; line-height: normal; height: 120px; width: 120px" href="/settings/groups">
            <div style="padding-bottom: 5px"><i style="font-size: 40px" class="fas fa-grip-horizontal"></i></div>
            <div style="font-size:10px; height: 10px">{{ $t('settings.groups') }}</div>
          </f7-button>
        </f7-col>
        <f7-col>
          <f7-button class="elevation-10" fill large raised style="text-transform: none; padding-top:30px; line-height: normal; height: 120px; width: 120px" href="/settings/alerts">
            <div style="padding-bottom: 5px"><i style="font-size: 40px" class="fas fa-bell"></i></div>
            <div style="font-size:10px; height: 10px">{{ $t('settings.alerts') }}</div>
          </f7-button>
        </f7-col>
      </f7-row>
      <f7-row>
        <f7-col>
          <f7-button class="elevation-10" fill large raised style="text-transform: none; padding-top:30px; line-height: normal; height: 120px; width: 120px" href="/settings/drivers">
            <div style="padding-bottom: 5px"><i style="font-size: 40px" class="fas fa-address-card"></i></div>
            <div style="font-size:10px; height: 10px">{{ $t('settings.drivers') }}</div>
          </f7-button>
        </f7-col>
        <f7-col>
          <f7-button class="elevation-10" fill large raised style="text-transform: none; padding-top:30px; line-height: normal; height: 120px; width: 120px" href="/settings/map">
            <div style="padding-bottom: 5px"><i style="font-size: 40px" class="fas fa-map"></i></div>
            <div style="font-size:10px; height: 10px">{{ $t('settings.map') }}</div>
          </f7-button>
        </f7-col>
      </f7-row>
      <f7-row>
        <f7-col>
          <f7-button class="elevation-10" fill large raised style="text-transform: none; padding-top:15px; line-height: normal; height: 80px; width: 80px" href="/settings/about">
            <div style="padding-bottom: 5px"><i style="font-size: 35px" class="fas fa-info-circle"></i></div>
            <div style="font-size:10px; height: 10px">{{ $t('settings.about') }}</div>
          </f7-button>
        </f7-col>
        <f7-col>
          <f7-button class="elevation-10" fill large raised style="text-transform: none; padding-top:15px; line-height: normal; height: 80px; width: 80px" @click="refreshApp">
            <div style="padding-bottom: 5px"><i style="font-size: 35px" class="fas fa-redo"></i></div>
            <div style="font-size:10px; height: 10px">{{ $t('settings.refresh') }}</div>
          </f7-button>
        </f7-col>
        <f7-col>
          <f7-button class="elevation-10" fill large raised style="text-transform: none; padding-top:15px; line-height: normal; height: 80px; width: 80px" @click="logout">
            <div style="padding-bottom: 5px"><i style="font-size: 35px" class="fas fa-sign-out-alt"></i></div>
            <div style="font-size:10px; height: 10px">{{ $t('settings.logout') }}</div>
          </f7-button>
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

<style>
  div[class*="col"] {
    text-align: center;
    color: #000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 5px;
    margin-bottom: 16px;
    font-size: 12px;
  }
</style>
