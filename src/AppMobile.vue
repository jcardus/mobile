<template>
  <f7-app :params="f7params">
    <f7-panel left cover theme-dark style="min-width: 300px" @panel:closed="panelClosed">
      <data-container></data-container>
    </f7-panel>
    <f7-views tabs class="safe-areas">
      <f7-toolbar :bottom="true" labels tabbar>
        <f7-link tab-link="#view-map" tab-link-active icon-ios="f7:map_fill" icon-aurora="f7:map_fill" icon-md="material:map" :text="$t('route.map')"></f7-link>
        <f7-link tab-link="#view-reports" icon-ios="f7:doc_plaintext" icon-aurora="f7:doc_plaintext" icon-md="material:notes" :text="$t('route.reports')"></f7-link>
        <f7-link v-if="hostname === 'wuizy.co.ao'" tab-link="#view-dashboard" icon-aurora="f7:dashboard" icon-ios="f7:rectangle_grid_2x2" icon-md="material:dashboard" :text="$t('route.dashboard')"></f7-link>
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
        @tab:show="emitEvent('mapShown')"
      ></f7-view>
      <f7-view id="view-reports" name="reports" tab url="/reports" @tab:show="emitEvent('reportsActive')"></f7-view>
      <f7-view id="view-dashboard" name="dashboard" tab url="/dashboard" @tab:show="emitEvent('dashboardActive')"></f7-view>
      <f7-view id="view-settings" name="settings" tab url="/settings"></f7-view>
      <f7-view id="view-alerts" name="alerts" tab url="/alerts" @tab:show="emitEvent('eventsActive')"></f7-view>
      <f7-view id="view-login" name="login" url="/login"></f7-view>
    </f7-views>
    <f7-login-screen id="loginScreen">
      <f7-page
        :no-toolbar="true"
        login-screen
        :style="'margin-top: 0 !important;background-size: cover;background-image: url(\'' + imageSrc + '\')'"
      >
        <div class="login_form">
          <f7-login-screen-title>
            <div class="title-container">
              <img class="logo" :src="logo" alt="">
            </div>
          </f7-login-screen-title>
          <f7-list v-if="showLogin" form>
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
              :type="showPassword?'text':'password'"
              :value="password"
              @input="password = $event.target.value"
            >
              <f7-icon slot="media" icon="fas fa-unlock-alt" style="font-size:20px"></f7-icon>
              <div slot="content-end" @click="showPassword=!showPassword">
                <f7-icon :icon="`fas fa-eye${showPassword?'-slash':''}`" style="font-size:20px"></f7-icon>
              </div>
            </f7-list-input>
          </f7-list>
          <f7-list>
            <f7-list-button :title="$t('login.login_button')" @click="signIn"></f7-list-button>
            <google-button v-if="socialSignIn" style="width:220px;margin:auto;"></google-button>
            <f7-list-item v-if="socialSignIn">
              <f7-link style="margin:auto;">
                <apple-button :width="220"></apple-button>
              </f7-link>
            </f7-list-item>
          </f7-list>
          <f7-block></f7-block>
          <f7-list>
            <f7-button v-if="platform !== 'ios'" :external="true" :href="signUp">{{ $t('login.register') }}</f7-button>
            <f7-button :external="true" :href="forgetPassword">{{ $t('login.forgotPassword') }}</f7-button>
          </f7-list>
          <f7-block-footer>
            m{{ version }} {{ domain }}
          </f7-block-footer>
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
import { mapGetters } from 'vuex'
import { cdnUrl } from './utils/consts'
import GoogleButton from './views/login/GoogleButton'
import { forgotPassword, signUp } from './api'
import * as event from './events'
import AppleButton from '@/views/login/AppleButton'
import { Capacitor } from '@capacitor/core'
import { Browser } from '@capacitor/browser'
import { awsConfig } from '@/amplify'

export default {
  name: 'AppMobile',
  components: { AppleButton, GoogleButton, DataContainer },
  data() {
    return {
      showPassword: false,
      username: '',
      password: '',
      f7params: {
        name: 'Manager', // App name
        theme: 'auto', // Automatic theme detection
        routes: routes
      },
      toastNewVersion: null
    }
  },
  computed: {
    ...mapGetters(['unreadItems', 'user', 'portrait']),
    socialSignIn() {
      return process.env.SOCIAL_SIGN_IN && !this.isCapacitor
    },
    signUp() {
      return signUp()
    },
    hostname() {
      return window.location.hostname
    },
    forgetPassword() {
      return forgotPassword()
    },
    isCapacitor() {
      return Capacitor.isNativePlatform()
    },
    platform() {
      return Capacitor.getPlatform()
    },
    showLogin() {
      return !this.isCapacitor || process.env.SOCIAL_SIGN_IN === 'false'
    },
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
    imageSrc() {
      return `${cdnUrl}/images/login_1.jpg`
    }
  },
  beforeDestroy() {
    serverBus.$off(event.newEventReceived, this.showNotifications)
    serverBus.$off('updateAvailable', this.updateAvailable)
    serverBus.$off('message', this.message)
    window.removeEventListener('orientationchange', this.orientationChange)
  },
  created() {
    Vue.$log.info('AppMobile', this.offline)
    serverBus.$on(event.newEventReceived, this.showNotifications)
    serverBus.$on('updateAvailable', this.updateAvailable)
    serverBus.$on('message', this.message)
    window.addEventListener('orientationchange', this.orientationChange)
  },
  async mounted() {
    try {
      this.$log.info('mounted AppMobile', this.user, this.version, process.env)
      if (!Capacitor.isNativePlatform()) {
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
      }
      await this.$store.dispatch('user/checkSession')
      if (this.user.name !== '') {
        this.$log.info('closing login screen...', this.user)
        this.$f7.loginScreen.close('#loginScreen', false)
      } else {
        this.$log.debug('opening login screen...', this.$f7.loginScreen)
        this.$f7.loginScreen.open('#loginScreen', false)
        this.$f7.preloader.hide()
      }
    } catch (e) {
      Vue.$log.error('error in AppMobile mounted', e)
    }
  },
  methods: {
    orientationChange() {
      this.$store.dispatch('transient/setPortrait', window.orientation === 0).then(() => {
        this.$log.debug(this.portrait)
        if (this.portrait) {
          this.$f7.toolbar.show('.toolbar')
        } else {
          this.$f7.toolbar.hide('.toolbar')
        }
      })
    },
    googleSignIn() {
      this.$f7.preloader.show()
    },
    async nativeSignIn() {
      await Browser.open({
        url: 'https://account.fleetmap.io/' + navigator.language.substring(0, 2) + '/?client_id=' + awsConfig.aws_user_pools_web_client_id + '&domain=' + awsConfig.oauth.domain,
        presentationStyle: 'popover'
      })
    },
    signIn() {
      if (!this.showLogin) {
        return this.nativeSignIn()
      }
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
      this.$log.debug(event)
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
      new Audio('/sound/doorbell.wav').play().catch(e => console.error(e))
      this.$f7.notification.create({
        icon: '<img width="20" height="20" src="' + partner.getFavIcon() + '" alt=""/>',
        titleRightText: '',
        title: event.description,
        text: notifications.getMessage(event),
        closeTimeout: 5000,
        subtitle: partner.getTitle()
      }).open()
    },
    panelClosed() {
      Vue.$log.debug('panelClosed')
      lnglat.updateDonuts()
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
    --f7-input-text-color: black;
    --f7-login-screen-list-button-text-color: white;
    --f7-list-item-padding-horizontal: 15px;
    --f7-list-item-media-margin: 8px;
  }

  .login-screen-page .login-screen-content,
  .login-screen-page .page-content,
  .login-screen>.page .login-screen-content,
  .login-screen>.page .page-content,
  .login-screen>.view>.page,
  .login-screen-content,
  .login-screen>.view>.page .page-content {
    margin-top: 0;
    margin-bottom: 0;
    height: 100%;
    width: 100%;
  }

  .list-button {
    background-color: #055AE5;
    margin-left: 15px;
    margin-right: 15px;
    margin-bottom: 2px;
    color: white;
    border-radius: 20px;
  }

  .login_form {
    margin-left:30px;
    margin-right:30px;
    background:  #fff;
    opacity: 0.8;
    position: absolute;
    border-radius: 20px;
    top: 50%;
    transform: translateY(-50%);
    width: calc(100% - 60px);
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
    margin-top: 0;
    margin-right: auto;
    margin-left: auto;
    margin-bottom: 40px;
    display: block;
    width: 50%;
  }
</style>
