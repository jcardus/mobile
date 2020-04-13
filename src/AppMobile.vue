<template>
  <f7-app :params="f7params">
    <f7-panel left cover theme-dark style="min-width: 300px" @panel:closed="panelClosed">
      <data-container></data-container>
    </f7-panel>
    <f7-views tabs class="safe-areas">
      <f7-toolbar :bottom="true" labels tabbar>
        <f7-link tab-link="#view-map" tab-link-active icon-ios="f7:map_fill" icon-aurora="f7:map_fill" icon-md="material:map" :text="$t('route.map')"></f7-link>
        <f7-link tab-link="#view-reports" icon-ios="f7:doc_plaintext" icon-aurora="f7:doc_plaintext" icon-md="material:notes" :text="$t('route.reports')"></f7-link>
        <f7-link tab-link="#view-dashboard" icon-aurora="f7:dashboard" icon-ios="f7:rectangle_grid_2x2" icon-md="material:dashboard" :text="$t('route.dashboard')"></f7-link>
        <f7-link tab-link="#view-settings" icon-ios="f7:gear" icon-aurora="f7:gear" icon-md="material:settings" :text="$t('route.settings')"></f7-link>
        <f7-link tab-link="#view-alerts">
          <f7-icon ios="f7:bell_fill" aurora="f7:bell_fill" md="material:notifications">
            <f7-badge v-if="unreadItems" color="red">{{ unreadItems }}</f7-badge>
          </f7-icon>
          <span class="tabbar-label">{{ $t('route.alerts') }}</span>
        </f7-link>
      </f7-toolbar>
      <f7-view
        id="view-map"
        main
        tab
        tab-active
        url="/map"
        @tab:show="emitEvent('mapActive')"
      ></f7-view>
      <f7-view id="view-reports" name="reports" tab url="/reports" @tab:show="emitEvent('reportsActive')"></f7-view>
      <f7-view id="view-dashboard" name="dashboard" tab url="/dashboard" @tab:show="emitEvent('dashboardActive')"></f7-view>
      <f7-view id="view-settings" name="settings" tab url="/settings"></f7-view>
      <f7-view id="view-alerts" name="alerts" tab url="/alerts" @tab:show="emitEvent('eventsActive')"></f7-view>
      <f7-view id="view-login" name="login" url="/login"></f7-view>
    </f7-views>
    <f7-login-screen id="loginScreen">
      <f7-page login-screen :style="'background-size: cover;background-image: url(\'' + imageSrc + '\')'">
        <div class="login_form">
          <f7-login-screen-title>
            <div class="title-container">
              <img class="logo" :src="logo" alt="">
            </div>
          </f7-login-screen-title>
          <f7-list form>
            <f7-list-input
              name="username"
              :placeholder="$t('login.login_user')"
              type="text"
              :value="username"
              @input="username = $event.target.value"
            >
              <f7-icon slot="media" icon="fas fa-user" style="font-size:20px"></f7-icon>

            </f7-list-input>
            <f7-list-input
              autocomplete="on"
              name="password"
              :placeholder="$t('login.login_password')"
              type="password"
              :value="password"
              @input="password = $event.target.value"
            >
              <f7-icon slot="media" icon="fas fa-unlock-alt" style="font-size:20px"></f7-icon>
            </f7-list-input>
          </f7-list>
          <f7-list>
            <f7-list-button :title="$t('login.login_button')" @click="signIn"></f7-list-button>
            <f7-block-footer>
              {{ version }} {{ domain }}
            </f7-block-footer>
          </f7-list>
        </div>
      </f7-page>
    </f7-login-screen>
  </f7-app>
</template>

<script>
import routes from './framework7/routes/routes'
import DataContainer from './views/map/DataContainer'
import Vue from 'vue'
import * as lnglat from './utils/lnglat'
import * as notifications from './utils/notifications'
import { serverBus } from './main'
import { reload } from './utils/utils'
import * as partner from './utils/partner'
import { appOffline } from './utils/utils'
import { mapGetters } from 'vuex'
import { cdnUrl } from './utils/consts'

export default {
  name: 'AppMobile',
  components: { DataContainer },
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
    ...mapGetters(['unreadItems', 'user']),
    domain() {
      return window.location.hostname
    },
    version() {
      return process.env.PACKAGE_VERSION
    },
    logo() {
      return partner.getLogo()
    },
    ios() {
      return this.$device.ios
    },
    offline() {
      return appOffline()
    },
    imageSrc() {
      return `${cdnUrl}/images/login_1.jpg`
    }
  },
  beforeDestroy() {
    serverBus.$off('event', this.showNotifications)
    serverBus.$off('updateAvailable', this.updateAvailable)
    serverBus.$off('message', this.message)
  },
  created() {
    Vue.$log.info('AppMobile', this.offline)
    serverBus.$on('event', this.showNotifications)
    serverBus.$on('updateAvailable', this.updateAvailable)
    serverBus.$on('message', this.message)
  },
  mounted() {
    try {
      this.$log.debug('AppMobile', this.user)
      document.getElementById('favicon').href = partner.getFavIcon()
      document.getElementById('title').innerHTML = partner.getTitle() + ' ' + this.version
      this.toastNewVersion = this.$f7.toast.create({
        text: this.$t('layout.newVersion'),
        closeButton: true,
        closeButtonColor: 'white',
        on: {
          close: reload
        }
      })
      this.$store.dispatch('user/checkSession').then(() => {
        if (this.user.name !== '') {
          this.$log.info('closing login screen...', this.user)
          this.$f7.loginScreen.close('#loginScreen', false)
        } else {
          this.$log.debug('opening login screen...', this.$f7.loginScreen)
          this.$f7.loginScreen.open('#loginScreen', false)
          this.$f7.preloader.hide()
        }
      })
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
    emitEvent(event) {
      serverBus.$emit(event)
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
    showNotifications(event) {
      this.$f7.notification.create({
        icon: '<img width="20" height="20" src="' + partner.getFavIcon() + '" alt=""/>',
        titleRightText: '',
        title: event.type && this.$t('layout.' + event.type),
        text: notifications.getMessage(event),
        closeTimeout: 5000,
        subtitle: partner.getTitle()
      }).open()
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

<style lang="scss">
  @import './framework7/css/framework7.bundle.min.css';
  @import './framework7/css/icons.css';

  :root {
    --f7-login-screen-content-bg-color: #fff0;
    --f7-label-font-size: 18px;
    --f7-input-font-size: 14px;
    --f7-list-item-padding-horizontal: 20px;
    --f7-input-text-color: black;
    --f7-login-screen-list-button-text-color: white;
    --f7-list-item-padding-horizontal: 15px;
    --f7-list-item-media-margin: 8px;
  }

  .login-screen-page .login-screen-content,
  .login-screen-page .page-content,
  .login-screen>.page .login-screen-content,
  .login-screen>.page .page-content,
  .login-screen>.view>.page
  .login-screen-content,
  .login-screen>.view>.page .page-content {
    margin-top: 60px;
    margin-bottom: 0px;
    height: 100%;
    width: 100%;
  }

  .list-button {
    background-color: #055AE5;
    margin-left: 15px;
    margin-right: 15px;
    margin-bottom: 20px;
    color: white;
    border-radius: 20px;
  }

  .login_form {
    margin-left:40px;
    margin-right:40px;
    background:  #fff;
    opacity: 0.8;
    padding-bottom: 20px;
    padding-top: 20px;
    position: center;
    border-radius: 20px;
  }

  .md .item-input .item-media {
    align-self: normal;
  }

  .md .list .item-media {
    min-width: 20px;
  }

  .item-input {
    margin-bottom: 10px;
  }

  .item-title{
    font-size: 20px;
  }

  .logo {
    margin: 0 auto 40px auto;
    display: block;
    width: 50%;
  }
</style>
