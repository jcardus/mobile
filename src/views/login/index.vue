<template>
  <div>
    <el-row class="login-container">
      <el-col :span="16" style="height: 100%">
        <el-image
          :src="imageSrc"
          fit="cover"
          style="height: 100%; width: 100%;"
        />
      </el-col>
      <el-col :span="8" style="height: 100%">
        <div class="parentDiv">
          <div class="loginFormDiv">
            <el-form ref="loginForm" :model="loginForm" :rules="loginRules" class="login-form" autocomplete="on" label-position="left">
              <div class="title-container">
                <img class="logo" :src="logoImage" alt="">
              </div>
              <el-form-item prop="username" :label="$t('login.login_user')">
                <el-input
                  ref="username"
                  v-model="loginForm.username"
                  name="username"
                  type="text"
                  tabindex="1"
                  autocomplete="on"
                  :class="cssName"
                />
              </el-form-item>
              <el-tooltip v-model="capsTooltip" content="Caps lock is On" placement="right" manual>
                <el-form-item prop="password" :label="$t('login.login_password')">
                  <el-input
                    :key="passwordType"
                    ref="password"
                    v-model="loginForm.password"
                    :show-password="true"
                    :type="passwordType"
                    name="password"
                    tabindex="2"
                    autocomplete="on"
                    :class="cssName"
                    @keyup.native="checkCapslock"
                    @blur="capsTooltip = false"
                    @keyup.enter.native="handleLogin"
                  />
                </el-form-item>
              </el-tooltip>
              <div>
                <el-button :loading="loading" type="primary" :style="'margin-bottom:30px; background-color: '+themeColor+'; border-color: '+themeColor" @click.native.prevent="handleLogin">{{ $t('login.login_button') }}</el-button>
              </div>
              <div>
                <el-tag size="mini" effect="plain" style="float:right">v{{ version }}</el-tag>
              </div>
            </el-form>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script>

import Vue from 'vue'
import * as partner from '../../utils/partner'
import { cdnUrl } from '../../utils/consts'

export default {
  name: 'Login',
  data() {
    const validateUsername = (rule, value, callback) => {
      callback()
    }
    const validatePassword = (rule, value, callback) => {
      if (value.length < 6) {
        callback(new Error(this.$t('login.login_password_warn')))
      } else {
        callback()
      }
    }
    return {
      loginForm: {
        username: '',
        password: ''
      },
      loginRules: {
        username: [{ required: true, trigger: 'blur', validator: validateUsername }],
        password: [{ required: true, trigger: 'blur', validator: validatePassword }]
      },
      passwordType: 'password',
      capsTooltip: false,
      loading: false,
      showDialog: false,
      redirect: undefined,
      otherQuery: {}
    }
  },
  computed: {
    logoImage() {
      return partner.getLogo()
    },
    imageSrc() {
      return `${cdnUrl}/images/login_${Math.floor(Math.random() * 10 + 1)}.jpg`
    },
    themeColor: function() {
      return partner.getThemeColor()
    },
    cssName: function() {
      return partner.getCSSName()
    },
    version() {
      let v = process.env.PACKAGE_VERSION
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
    if (this.$refs.username && this.loginForm.username === '') {
      this.$refs.username.focus()
    } else if (this.loginForm.password && this.loginForm.password === '') {
      this.$refs.password.focus()
    }
  },
  methods: {
    checkCapslock({ shiftKey, key } = {}) {
      if (key && key.length === 1) {
        this.capsTooltip = shiftKey && (key >= 'a' && key <= 'z') || !shiftKey && (key >= 'A' && key <= 'Z')
      }
      if (key === 'CapsLock' && this.capsTooltip === true) {
        this.capsTooltip = false
      }
    },
    showPwd() {
      if (this.passwordType === 'password') {
        this.passwordType = ''
      } else {
        this.passwordType = 'password'
      }
      this.$nextTick(() => {
        this.$refs.password.focus()
      })
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

  $bg:#ffffff;
  $dark_gray:#889aa4;
  $light_gray:#fff;
  $cursor: #202020;
  $darkest_gray:#202020;

  .login-container {
    height: 100vh;
    .parentDiv {
      height: 100%;
      width: 100%;
      position: relative;
      .loginFormDiv {
        width: 100%;
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        .login-form {
          padding: 40px;
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

        .svg-container {
          padding: 6px 5px 6px 15px;
          color: $dark_gray;
          vertical-align: middle;
          width: 30px;
          display: inline-block;
        }

        .title-container {
          width: 100%;
          text-align: center;
          .logo {
            padding: 10px;
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

        .wuizy {
          input {
            border-color: #91D400;
          }
        }

        .fleetrack {
          input {
            border-color: #055AE5;
          }
        }

        .able-on {
          input {
            border-color: #055AE5;
          }
        }

        .el-input {
          display: inline-block;
          height: 47px;
          width: 100%;

          input {
            background: transparent;
            border-right-width: 0;
            border-left-width: 0;
            border-top-width: 0;
            border-bottom-width: 2px;
            -webkit-appearance: none;
            border-radius: 0;
            padding: 12px 5px 12px 15px;
            color: $darkest_gray;
            height: 40px;
            caret-color: $cursor;
            font-size: 15px;
            font-family: "Open Sans", serif;

            &:-webkit-autofill {
              box-shadow: 0 0 0 1000px $bg inset !important;
              -webkit-text-fill-color: $cursor !important;
            }
          }
        }

        .el-button-login {
          width: 100px;
        }

        .el-form-item {
          border-radius: 5px;
          color: #454545;
        }

        .el-form-item__label {
          height: 25px;
          color: $dark_gray;
          font-size: 13px;
          font-family: "Open Sans", serif;
        }

        .show-pwd {
          position: absolute;
          right: 10px;
          top: 7px;
          font-size: 16px;
          color: $darkest_gray;
          cursor: pointer;
          user-select: none;
        }

        .el-button {
          width: 50%;
          alignment: right;
          font-family: "Open Sans", serif;
        }
      }
    }
  }
</style>
