<template>
  <f7-app :params="f7params">
    <f7-panel left cover theme-dark style="min-width: 290px" @panel:closed="panelClosed">
      <data-container />
    </f7-panel>
    <f7-views tabs class="safe-areas">
      <f7-toolbar :bottom="true" labels tabbar>
        <f7-link tab-link="#view-map" tab-link-active icon-ios="f7:map_fill" icon-aurora="f7:map_fill" icon-md="material:map" :text="$t('route.map')"></f7-link>
        <f7-link tab-link="#view-reports" icon-ios="f7:doc_plaintext" icon-aurora="f7:doc_plaintext" icon-md="material:notes" :text="$t('route.reports')"></f7-link>
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
      <f7-view id="view-settings" name="settings" tab url="/settings"></f7-view>
      <f7-view id="view-alerts" name="alerts" tab url="/alerts" @tab:show="emitEvent('eventsActive')"></f7-view>
      <f7-view id="view-login" name="login" url="/login"></f7-view>
    </f7-views>
    <f7-login-screen id="loginScreen">
      <f7-page
        :no-toolbar="true"
        login-screen
        :style="'margin-top: 0 !important;background-size: cover;background-color: rgba(0, 0, 0, 0.5)'"
      >
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
              :type="showPassword?'text':'password'"
              :value="password"
              @input="password = $event.target.value"
            >
              <f7-icon slot="media" icon="fas fa-unlock-alt" style="font-size:20px"></f7-icon>
              <div slot="content-end" style="padding: 5px" @click="showPassword=!showPassword">
                <f7-icon :icon="`fas fa-eye${showPassword?'-slash':''}`" style="font-size:20px"></f7-icon>
              </div>
            </f7-list-input>
          </f7-list>
          <f7-list>

            <f7-list-button v-loading="native" :title="$t('login.login_button')" @click="() => signIn('native')"></f7-list-button>
            <f7-list>
              <f7-button v-loading="Google" :large="web" :large-ios="ios" :large-md="android" style="width: 250px; margin: auto" fill icon-f7="logo_google" @click="() => signIn('Google')">{{ $t('login.signInWithGoogle') }}</f7-button>
            </f7-list>
            <f7-list>
              <f7-button v-loading="SignInWithApple" :large="web" :large-ios="ios" :large-md="android" style="width: 250px; margin: auto" fill icon-f7="logo_apple" @click="() => signIn('SignInWithApple')">{{ $t('Sign in with Apple') }}</f7-button>
            </f7-list>
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
import * as lnglat from './utils/lnglat'
import * as notifications from './utils/notifications'
import { serverBus } from './main'
import { reload } from './utils/utils'
import * as partner from './utils/partner'
import { mapGetters } from 'vuex'
import { forgotPassword, signUp } from './api'
import * as event from './events'
import { Capacitor } from '@capacitor/core'
import { Browser } from '@capacitor/browser'
import { awsConfig, getSocialLoginUrl } from '@/amplify'
import { Auth } from '@aws-amplify/auth'

export default {
  name: 'AppMobile',
  components: { DataContainer },
  data() {
    return {
      native: false,
      SignInWithApple: false,
      Google: false,
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
      return (process.env.SOCIAL_SIGN_IN && !this.isCapacitor) || Capacitor.getPlatform() === 'android'
    },
    signUp() {
      return signUp()
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
      return Capacitor.getPlatform() === 'android' || !this.isCapacitor || process.env.SOCIAL_SIGN_IN === 'false'
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
      return Capacitor.getPlatform() === 'ios'
    },
    web() {
      return Capacitor.getPlatform() === 'web'
    },
    android() {
      return Capacitor.getPlatform() === 'android'
    }
  },
  beforeDestroy() {
    serverBus.$off(event.newEventReceived, this.showNotifications)
    serverBus.$off('updateAvailable', this.updateAvailable)
    serverBus.$off('message', this.message)
    serverBus.$off('checkSession', this.checkSession)
    window.removeEventListener('orientationchange', this.orientationChange)
  },
  created() {
    serverBus.$on(event.newEventReceived, this.showNotifications)
    serverBus.$on('updateAvailable', this.updateAvailable)
    serverBus.$on('message', this.message)
    serverBus.$on('checkSession', this.checkSession)
    window.addEventListener('orientationchange', this.orientationChange)
  },
  methods: {
    async checkSession() {
      try {
        await this.$store.dispatch('user/checkSession')
      } catch (e) {
        console.error(e)
      }
      if (this.user && this.user.name !== '') {
        this.$f7.loginScreen.close('#loginScreen', false)
      } else {
        this.$f7.loginScreen.open('#loginScreen', false)
      }
      this.$f7.preloader.hide()
    },
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
    async nativeSignIn() {
      await Browser.open({
        url: 'https://account.fleetmap.io/?client_id=' + awsConfig.aws_user_pools_web_client_id +
          '&domain=' + awsConfig.oauth.domain +
          '&region=eu-west-3' +
          '&id_pool_id=' + process.env.ID_POOL_ID +
          '&user_pool_id=' + process.env.USER_POOL_ID,
        presentationStyle: 'popover'
      })
    },
    async signIn(type) {
      this[type] = true
      switch (type) {
        case 'native':
          try {
            await this.$store.dispatch('user/login', { username: this.username, password: this.password })
            this.$f7.loginScreen.close()
          } catch (e) {
            console.error(e)
            this.$f7.toast.create({
              closeTimeout: 5000,
              text: `${this.$t('login.login_user_password_invalid')} (${e.message})`,
              destroyOnClose: true
            }).open()
          } finally {
            this.$f7.preloader.hide()
            this.native = false
          }
          break
        case 'Google':
        case 'SignInWithApple':
          if (Capacitor.isNativePlatform()) {
            Browser.addListener('browserFinished', () => {
              this.Google = false
              this.SignInWithApple = false
              this.native = false
            })
            await Browser.open({
              url: getSocialLoginUrl(type),
              presentationStyle: 'popover'
            })
          } else {
            await Auth.federatedSignIn({ provider: type })
          }
      }
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
      lnglat.updateDonuts()
    },
    updateAvailable() {
      try {
        if (!this.toastNewVersion) {
          this.toastNewVersion = this.$f7.toast.create({
            text: this.$t('layout.newVersion'),
            closeButton: true,
            closeButtonColor: 'white',
            on: {
              close: reload
            }
          })
        }
        this.toastNewVersion.open()
      } catch (e) {
        console.error(e)
      }
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
