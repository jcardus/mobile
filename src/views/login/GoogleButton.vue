<template>
  <div class="google-btn" @click="click">
    <div>
      <img alt="" class="google-icon" src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" />
    </div>
    <div class="btn-text">
      <a @click="click">
        <b>
          {{ $t('login.signInWithGoogle') }}
        </b>
      </a>
    </div>
  </div>
</template>
<script>
import { Browser } from '@capacitor/browser'
import { getGoogleLogin } from '@/amplify'
import { Capacitor } from '@capacitor/core'
import { Auth } from '@aws-amplify/auth'

export default {
  name: 'GoogleButton',
  props: {
    withLink: {
      default: true,
      type: Boolean
    }
  },
  methods: {
    async click() {
      if (Capacitor.isNativePlatform()) {
        await Browser.open({ url: getGoogleLogin() })
      } else {
        await Auth.federatedSignIn({ provider: 'Google' })
      }
    }
  }
}
</script>
<style lang="scss" scoped>
  $white: #fff;
  $google-blue: #4285f4;
  $button-active-blue: #1669F2;

  .google-icon {
    padding-left: 8px;
    padding-right: 8px;
    padding-top: 11px;
    padding-bottom: 11px;
    width: 18px;
    height: 18px;
    display: inline-block;
    vertical-align: middle;
  }
  .btn-text {
    padding-left: 16px;
    padding-right: 8px;
    color: #808080;
    font-size: 14px;
    font-family: "Roboto",serif;
  }
  .google-btn {
    width: 220px;
    cursor:pointer;
    box-shadow: 0 2px 2px 0 rgba(0,0,0,.25);
    display:flex;
    flex-direction: row;
    height: 40px;
    border-radius: 2px;
    align-items: center;
    border: 1px solid;
    border-color: rgba(0,0,0,.05);;
  }
  @import url(https://fonts.googleapis.com/css?family=Roboto);
</style>
