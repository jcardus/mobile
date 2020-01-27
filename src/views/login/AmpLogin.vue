<template>
  <div>
    <el-row type="flex" style="height: 10vh">
    </el-row>
    <el-row type="flex" justify="center" class="header">
      <logo-svg v-if="hasSVG" class="logo"></logo-svg>
      <img v-else class="logo" :src="logoImage" alt="">
    </el-row>
    <el-row type="flex" justify="center" align="middle">
      <amplify-authenticator></amplify-authenticator>
    </el-row>
  </div>
</template>

<script>

import Vue from 'vue'
import * as partner from '../../utils/partner'
import LogoSvg from '../../layout/components/LogoSvg'

export default {
  name: 'AmpLogin',
  components: { LogoSvg },
  data() {
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
  mounted() {
  },
  methods: {
    hasSVG() {
      return partner.hasSVG()
    },
    handleLogin() {
      this.$refs.loginForm.validate(valid => {
        if (valid) {
          this.loading = true
          Vue.$log.debug('dispatch user login ', this.loginForm)
          this.$store.dispatch('user/login', this.loginForm)
            .then(() => {
              Vue.$log.debug('pushing...', this.redirect || '/', this.otherQuery)
              this.$router.push({ path: this.redirect || '/', query: this.otherQuery })
              this.loading = false
              Vue.$log.debug('done')
            })
            .catch(exception => {
              Vue.$log.error(exception)
              this.loading = false
            })
        } else {
          Vue.$log.error('error submit!!')
          return false
        }
      })
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

  $bg:#283443;
  $light_gray:#fff;
  $cursor: #fff;

  .logo {
    max-width:300px;
    padding: 20px
  }

</style>
