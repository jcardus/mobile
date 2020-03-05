<template>
  <div class="login-container">
    <div class="loginFormDiv">
      <div class="loginForm">
        <div class="title-container">
          <img class="logo" :src="logoImage" alt="">
        </div>
        <div>
          <amplify-authenticator :auth-config="authConfig">
          </amplify-authenticator>
        </div>
        <div>
          <el-tag size="mini" effect="plain" style="float:right">v{{ version }}</el-tag>
        </div>
      </div>
    </div>
  </div>
</template>

<script>

import * as partner from '../../utils/partner'
import { I18n } from '@aws-amplify/core'
import { getLanguage } from '../../lang'

export default {
  name: 'AmpLogin',
  data() {
    return {
      authConfig: {
        usernameAttributes: 'Email',
        signUpConfig: {
          hideAllDefaults: true,
          defaultCountryCode: '351',
          signUpFields: [
            {
              label: 'Email',
              key: 'email',
              required: true,
              displayOrder: 1,
              type: 'string',
              signUpWith: true
            },
            {
              label: 'Password',
              key: 'password',
              required: true,
              displayOrder: 2,
              type: 'password'
            },
            {
              label: 'PhoneNumber',
              key: 'phone_number',
              required: true,
              displayOrder: 3,
              type: 'string'
            }
          ]
        }
      }
    }
  },
  computed: {
    logoImage: function() {
      return partner.getLogo()
    },
    version() {
      let v = this.$store.state.app.packageVersion
      if (process.env.NODE_ENV === 'development') {
        v += '-dev'
      }
      return v
    }
  },
  watch: {
    $route: {
      handler: function(route) {
        const query = route.query
        if (query) {
          this.redirect = query.redirect
          this.otherQuery = this.getOtherQuery(query)
        }
      },
      immediate: true
    }
  },
  created() {
    const dict = {
      'es': {
        'Sign In': 'Registrarse',
        'Sign Up': 'Regístrate'
      },
      'fr': {
        'Sign In': 'Se connecter2',
        'Sign Up': "S'inscrire"
      }
    }

    I18n.putVocabularies(dict)
    const lang = getLanguage().slice(2)
    this.$log.debug('setting lang to ', lang)
    I18n.setLanguage(lang)
  },
  methods: {
    hasSVG() {
      return partner.hasSVG()
    },
    getOtherQuery(query) {
      return Object.keys(query).reduce((acc, cur) => {
        if (cur !== 'redirect') {
          acc[cur] = query[cur]
        }
        return acc
      }, {})
    }
  }
}

</script>

<style lang="scss">
  @import '../../styles/element-variables';

  $bg:#ffffff;
  $dark_gray:#889aa4;
  $light_gray:#fff;
  $cursor: #202020;
  $darkest_gray:#202020;

  .login-container {
    min-height: 100%;
    height: 100vh;
    width: 100%;
    background-color: $bg;
    overflow: hidden;
    background-image: url('../../../public/img/login/login.png');
    background-repeat: no-repeat;
    background-size: 50% 100%;

    .loginFormDiv {
      position: relative;
      width: 50%;
      float: right;
      overflow: hidden;

      .loginForm {
        padding: 150px 50px;
      }

      .tips {
        font-size: 14px;
        color: #fff;
        margin-bottom: 10px;

        span {
          &:first-of-type {
            margin-right: 16px;
          }
        }
      }

      .title-container {
        position: relative;

        .logo {
          margin: 0 auto 20px auto;
          max-width: 200px;
        }

        .set-language {
          color: #fff;
          position: absolute;
          top: 3px;
          font-size: 18px;
          right: 0;
          cursor: pointer;
        }
      }
    }
  }

</style>
