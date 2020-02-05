<template>
  <div class="mainLogin">
    <el-row type="flex" style="height: 10vh">
    </el-row>
    <el-row type="flex" justify="center" class="header">
      <logo-svg v-if="hasSVG" class="logo"></logo-svg>
      <img v-else class="logo" :src="logoImage" alt="">
    </el-row>
    <el-row type="flex" justify="center" align="middle">
      <amplify-authenticator :auth-config="authConfig">
      </amplify-authenticator>
    </el-row>
  </div>
</template>

<script>

import * as partner from '../../utils/partner'
import LogoSvg from '../../layout/components/LogoSvg'
import { I18n } from '@aws-amplify/core'
import { getLanguage } from '../../lang'

export default {
  name: 'AmpLogin',
  components: { LogoSvg },
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
    I18n.setLanguage(getLanguage().slice(2))
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

<style lang="scss" scoped>
  @import '../../styles/element-variables';

  .mainLogin {
    background-color: $--border-color-lighter;
    height: 100vh;
  }
  .logo {
    max-width:300px;
    padding: 20px
  }

</style>
