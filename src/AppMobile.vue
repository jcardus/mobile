<template>
  <f7-app :params="f7params">
    <f7-panel left cover theme-dark @panel:closed="panelClosed">
      <vehicle-table-container></vehicle-table-container>
    </f7-panel>
    <f7-views tabs class="safe-areas">
      <f7-toolbar bottom labels tabbar>
        <f7-link tab-link="#view-map" tab-link-active icon-ios="f7:map_fill" icon-aurora="f7:map_fill" icon-md="material:map" :text="$t('route.map')"></f7-link>
        <f7-link tab-link="#view-reports" icon-ios="f7:doc_plaintext" icon-aurora="f7:doc_plaintext" icon-md="material:notes" :text="$t('route.reports')"></f7-link>
        <f7-link v-if="!ios" tab-link="#view-dashboard" icon-aurora="f7:dashboard" icon-md="material:dashboard" :text="$t('route.dashboard')"></f7-link>
        <f7-link tab-link="#view-settings" icon-ios="f7:gear" icon-aurora="f7:gear" icon-md="material:settings" :text="$t('route.settings')"></f7-link>
      </f7-toolbar>
      <f7-view id="view-map" main tab tab-active url="/map" @tab:show="mapShow"></f7-view>
      <f7-view id="view-reports" name="reports" tab url="/reports" @tab:show="reportsShow"></f7-view>
      <f7-view v-if="!ios" id="view-dashboard" name="dashboard" tab url="/dashboard"></f7-view>
      <f7-view id="view-settings" name="settings" tab url="/settings"></f7-view>
      <f7-view id="view-login" name="login" url="/login"></f7-view>
    </f7-views>

    <i class="f7-icons"></i>
  </f7-app>
</template>

<script>
import routes from './framework7/routes/routes'
import VehicleTableContainer from './views/map/VehicleTableContainer'
import Vue from 'vue'
import { getToken } from './utils/auth'
import * as lnglat from './utils/lnglat'
import * as notifications from './utils/notifications'
import { serverBus } from './main'
import { reload, checkForUpdates } from './utils/utils'
import * as partner from './utils/partner'
import { traccar } from './api/traccar-api'
import { appOffline } from './utils/utils'

export default {
  name: 'AppMobile',
  components: { VehicleTableContainer },
  data() {
    return {
      loginScreenOpened: true,
      username: '',
      password: '',
      // Framework7 Parameters
      f7params: {
        name: 'Pinme', // App name
        theme: 'auto', // Automatic theme detection
        routes: routes
      },
      toastNewVersion: null
    }
  },
  computed: {
    ios() {
      return this.$device.ios
    },
    offline() {
      return appOffline()
    }
  },
  created() {
    Vue.$log.debug('created AppMobile')
    this.$root.$store.subscribe(this.showNotifications)
    serverBus.$on('updateAvailable', this.updateAvailable)
    serverBus.$on('alertMessage', this.alertMessage)
  },
  mounted: function() {
    try {
      this.$log.debug('App mobile')
      document.getElementById('favicon').href = partner.getFavIcon()
      document.getElementById('title').innerHTML = partner.getTitle() + ' ' + this.$store.state.app.packageVersion
      this.toastNewVersion = this.$f7.toast.create({
        text: this.$t('layout.newVersion'),
        closeButton: true,
        closeButtonColor: 'white',
        on: {
          close: reload
        }
      })
      const cookie = getToken()
      Vue.$log.debug('cookie:', cookie)
      if (cookie === null) {
        this.$f7.views.main.router.navigate('/login', { transition: 'f7-fade' })
      } else {
        this.$log.debug('App mobile created with cookie dispatching setUser')
        this.$store.dispatch('user/setUser')
      }
    } catch (e) {
      Vue.$log.error(e)
    }
  },
  methods: {
    mapShow() {
      this.$log.debug('mapShow')
      traccar.ping(() => {}, (e) => {
        Vue.$log.error(e)
      })
      if (this.offline) {
        this.$log.debug('socket disconnected, reconnecting...')
        const self = this
        this.$f7.dialog.confirm(this.$t('app.reconnect'), this.$t('app.connectionLost'), () => {
          self.$root.$store.dispatch('app/connect').then(() => {
            Vue.$log.debug('reconnected')
          })
        })
      }
    },
    alertMessage(message) {
      this.$f7.dialog.alert(this.$t(message))
    },
    reportsShow() {
      Vue.$log.debug('emit reportsActive')
      serverBus.$emit('reportsActive')
    },
    showNotifications(mutation, state) {
      if (mutation.type === 'SOCKET_ONMESSAGE') {
        if (state.socket.message.events) {
          const events = state.socket.message.events
          for (let i = 0; i < events.length; i++) {
            const event = events[i]
            this.$f7.notification.create({
              icon: '<img width="20" height="20" src="' + partner.getFavIcon() + '" alt=""/>',
              titleRightText: '',
              title: this.$t('layout.' + event.type),
              text: notifications.getMessage(event),
              closeTimeout: 5000,
              subtitle: partner.getTitle()
            }).open()
          }
        }
      }
    },
    panelClosed() {
      Vue.$log.debug('panelClosed')
      lnglat.updateMarkers()
      checkForUpdates()
    },
    updateAvailable() {
      this.toastNewVersion.open()
    }
  }
}
</script>

<style lang="scss">
  @import './framework7/css/framework7.bundle.min.css';
  @import './framework7/css/icons.css';
</style>
