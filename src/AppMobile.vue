<template>
  <f7-app :params="f7params">
    <f7-panel left cover theme-dark style="min-width: 300px" @panel:closed="panelClosed">
      <vehicle-table-container></vehicle-table-container>
    </f7-panel>
    <f7-views tabs class="safe-areas">
      <f7-toolbar :bottom="true" labels tabbar>
        <f7-link tab-link="#view-map" tab-link-active icon-ios="f7:map_fill" icon-aurora="f7:map_fill" icon-md="material:map" :text="$t('route.map')"></f7-link>
        <f7-link tab-link="#view-reports" icon-ios="f7:doc_plaintext" icon-aurora="f7:doc_plaintext" icon-md="material:notes" :text="$t('route.reports')"></f7-link>
        <f7-link tab-link="#view-dashboard" icon-aurora="f7:dashboard" icon-ios="f7:rectangle_grid_2x2" icon-md="material:dashboard" :text="$t('route.dashboard')"></f7-link>
        <f7-link tab-link="#view-settings" icon-ios="f7:gear" icon-aurora="f7:gear" icon-md="material:settings" :text="$t('route.settings')"></f7-link>
      </f7-toolbar>
      <f7-view id="view-map" main tab tab-active url="/map" @tab:show="mapShow"></f7-view>
      <f7-view id="view-reports" name="reports" tab url="/reports" @tab:show="reportsShow"></f7-view>
      <f7-view v-if="!ios" id="view-dashboard" name="dashboard" tab url="/dashboard"></f7-view>
      <f7-view id="view-settings" name="settings" tab url="/settings"></f7-view>
      <f7-view id="view-login" name="login" url="/login"></f7-view>
    </f7-views>
    <f7-login-screen id="loginScreen">
      <f7-page login-screen>
        <f7-login-screen-title>
          <div class="title-container">
            <img class="logo" :src="logo" alt="">
          </div>
        </f7-login-screen-title>
        <f7-list form>
          <f7-list-input
            name="username"
            :label="$t('login.login_user')"
            type="text"
            :value="username"
            @input="username = $event.target.value"
          ></f7-list-input>
          <f7-list-input
            name="password"
            :label="$t('login.login_password')"
            type="password"
            :value="password"
            @input="password = $event.target.value"
          ></f7-list-input>
        </f7-list>
        <f7-list>
          <f7-list-button :title="$t('login.login_button')" @click="signIn"></f7-list-button>
          <f7-block-footer>
            {{ version }} {{ domain }}
          </f7-block-footer>
        </f7-list>
      </f7-page>
    </f7-login-screen>
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
import { reload } from './utils/utils'
import * as partner from './utils/partner'
import { appOffline } from './utils/utils'

export default {
  name: 'AppMobile',
  components: { VehicleTableContainer },
  data() {
    return {
      username: '',
      password: '',
      f7params: {
        name: 'Pinme', // App name
        theme: 'auto', // Automatic theme detection
        routes: routes
      },
      toastNewVersion: null
    }
  },
  computed: {
    dashboardUrl() {
      return 'https://' + this.domain + ':' + window.location.port + '/#/iosdashboard'
    },
    domain() {
      return window.location.hostname
    },
    version() {
      if (process.env.NODE_ENV === 'development') {
        return new Date()
      } else { return this.$store.state.app.packageVersion }
    },
    logo() {
      return partner.getLogo()
    },
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
    serverBus.$on('message', this.message)
  },
  mounted() {
    try {
      this.$log.debug('mounted App mobile')
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
      if (cookie !== null) {
        this.$log.debug('closing login screen...', this.$f7.loginScreen)
        this.$f7.loginScreen.close('#loginScreen', false)
        this.$log.debug('App mobile created with cookie dispatching setUser')
        this.$store.dispatch('user/setUser')
      } else {
        this.$log.debug('opening login screen...', this.$f7.loginScreen)
        this.$f7.loginScreen.open('#loginScreen', false)
      }
    } catch (e) {
      Vue.$log.error(e)
    }
  },
  methods: {
    signIn() {
      const self = this
      this.$log.debug('dispatch user login ')
      this.$f7.preloader.show()
      this.$store.dispatch('user/login', { username: this.username, password: this.password })
        .then(() => {
          self.$f7.preloader.hide()
          self.$f7.loginScreen.close()
        })
        .catch(exception => {
          self.$f7.preloader.hide()
          Vue.$log.error(exception)
          self.$f7.toast.create({
            closeTimeout: 4000,
            text: exception,
            destroyOnClose: true
          }).open()
        })
    },
    mapShow() {
      serverBus.$emit('mapShown')
    },
    message(message) {
      this.$f7.notification.create({
        icon: '<img width="20" height="20" src="' + partner.getFavIcon() + '" alt=""/>',
        titleRightText: '',
        // title: this.$t('layout.' + event.type),
        text: message,
        closeTimeout: 5000,
        subtitle: partner.getTitle()
      }).open()
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
    },
    updateAvailable() {
      this.toastNewVersion.open()
    }
  }
}
</script>

<style lang="scss" scoped>
  @import './framework7/css/framework7.bundle.min.css';
  @import './framework7/css/icons.css';
  .logo {
    margin: 0 auto 40px auto;
    display: block;
    width: 50%;
  }
</style>
