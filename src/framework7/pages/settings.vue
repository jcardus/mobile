<template>
  <f7-page name="settings">
    <f7-navbar :title="$t('route.settings')"></f7-navbar>
    <f7-block style="width: 340px; margin-left: auto; margin-right: auto; margin-top: 100px">
      <f7-row no-gap>
        <f7-col style="padding:1px">
          <div class="settingButton">
            <a class="settingButton" href="/settings/vehicles">
              <div class="settingIcon"><i style="font-size: 40px" class="fas fa-car-alt"></i></div>
              <div class="settingText">{{ $t('settings.vehicles') }}</div>
            </a>
          </div>
        </f7-col>
        <f7-col style="padding:1px">
          <div class="settingButton">
            <a class="settingButton" href="/settings/geofences">
              <div class="settingIcon"><i style="font-size: 40px" class="fas fa-map-marked"></i></div>
              <div class="settingText">{{ $t('settings.zone') }}</div>
            </a>
          </div>
        </f7-col>
        <f7-col style="padding:1px">
          <div class="settingButton">
            <a class="settingButton" href="/settings/groups">
              <div class="settingIcon"><i style="font-size: 40px" class="fas fa-grip-horizontal"></i></div>
              <div class="settingText">{{ $t('settings.groups') }}</div>
            </a>
          </div>
        </f7-col>
      </f7-row>
      <f7-row no-gap>
        <f7-col style="padding:1px">
          <div class="settingButton">
            <a class="settingButton" href="/settings/alerts">
              <div class="settingIcon"><i style="font-size: 40px" class="fas fa-bell"></i></div>
              <div class="settingText">{{ $t('settings.alerts') }}</div>
            </a>
          </div>
        </f7-col>
        <f7-col style="padding:1px">
          <div class="settingButton">
            <a class="settingButton" href="/settings/drivers">
              <div class="settingIcon"><i style="font-size: 40px" class="fas fa-address-card"></i></div>
              <div class="settingText">{{ $t('settings.drivers') }}</div>
            </a>
          </div>
        </f7-col>
        <f7-col style="padding:1px">
          <div class="settingButton">
            <a class="settingButton" href="/settings/map">
              <div class="settingIcon"><i style="font-size: 40px" class="fas fa-map"></i></div>
              <div class="settingText">{{ $t('settings.map') }}</div>
            </a>
          </div>
        </f7-col>
      </f7-row>
      <f7-row no-gap>
        <f7-col style="padding:1px">
          <div class="settingButton">
            <a class="settingButton" href="/settings/about">
              <div class="settingIcon"><i style="font-size: 40px" class="fas fa-info-circle"></i></div>
              <div class="settingText">{{ $t('settings.about') }}</div>
            </a>
          </div>
        </f7-col>
        <f7-col style="padding:1px">
          <div class="settingButton">
            <a class="settingButton" @click="refreshApp">
              <div class="settingIcon"><i style="font-size: 40px" class="fas fa-redo"></i></div>
              <div class="settingText">{{ $t('settings.refresh') }}</div>
            </a>
          </div>
        </f7-col>
        <f7-col style="padding:1px">
          <div class="settingButton">
            <a class="settingButton" @click="logout">
              <div class="settingIcon"><i style="font-size: 40px" class="fas fa-sign-out-alt"></i></div>
              <div class="settingText">{{ $t('settings.logout') }}</div>
            </a>
          </div>
        </f7-col>
      </f7-row>
      <!-- <f7-row no-gap>
        <f7-col>
          <f7-button class="elevation-10" fill large raised style="text-transform: none; padding-top:30px; line-height: normal; height: 120px; width: 120px" href="/settings/alerts">
            <div style="padding-bottom: 5px"><i style="font-size: 40px" class="fas fa-bell"></i></div>
            <div style="font-size:10px; height: 10px">{{ $t('settings.alerts') }}</div>
          </f7-button>
        </f7-col>
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
      <f7-row no-gap>
        <f7-col>
          <f7-button class="elevation-10" fill large raised style="text-transform: none; padding-top:15px; line-height: normal; height: 120px; width: 120px" href="/settings/about">
            <div style="padding-bottom: 5px"><i style="font-size: 40px" class="fas fa-info-circle"></i></div>
            <div style="font-size:10px; height: 10px">{{ $t('settings.about') }}</div>
          </f7-button>
        </f7-col>
        <f7-col>
          <f7-button class="elevation-10" fill large raised style="text-transform: none; padding-top:15px; line-height: normal; height: 120px; width: 120px" @click="refreshApp">
            <div style="padding-bottom: 5px"><i style="font-size: 40px" class="fas fa-redo"></i></div>
            <div style="font-size:10px; height: 10px">{{ $t('settings.refresh') }}</div>
          </f7-button>
        </f7-col>
        <f7-col>
          <f7-button class="elevation-10" fill large raised style="text-transform: none; padding-top:15px; line-height: normal; height: 120px; width: 120px" @click="logout">
            <div style="padding-bottom: 5px"><i style="font-size: 40px" class="fas fa-sign-out-alt"></i></div>
            <div style="font-size:10px; height: 10px">{{ $t('settings.logout') }}</div>
          </f7-button>
        </f7-col>
      </f7-row>-->
    </f7-block>
  </f7-page>
</template>
<script>

import { appOffline } from '@/utils/utils'

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

<style lang="scss" scoped>
  @import '../../styles/element-variables.scss';

  .settingButton {
    vertical-align: middle;
    background-color: rgba($--color-primary, 0.1);
    display: table-cell;
    width: 100px;
    height: 100px;
  }
  .settingIcon {
    text-align: center;
    padding-bottom: 5px;
    color: $--color-primary;
  }
  .settingText {
    text-align: center;
    font-size:12px;
    color: $--color-primary;
  }
</style>
