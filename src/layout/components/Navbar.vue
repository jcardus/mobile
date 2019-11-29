<template>
  <div class="navbar" :style="top">
    <div v-show="!$route.path.includes('map')" class="left">
      <span>{{ title }}</span>
    </div>
    <div class="right-menu">
      <el-dropdown class="avatar-container right-menu-item hover-effect" trigger="click">
        <div style="padding:5px" class="el-dropdown-link">
          <el-avatar :src="avatar+'?imageView2/1/w/80/h/80'"></el-avatar>
        </div>
        <el-dropdown-menu slot="dropdown">
          <router-link to="/profile/index">
            <el-dropdown-item>{{ $t('navbar.profile') }}</el-dropdown-item>
          </router-link>
          <router-link to="/notifications">
            <el-dropdown-item>{{ $t('navbar.notifications') }}</el-dropdown-item>
          </router-link>
          <router-link to="/settings/index">
            <el-dropdown-item>{{ $t('navbar.settings') }}</el-dropdown-item>
          </router-link>
          <el-dropdown-item divided>
            <span style="display:block;" @click="logout">{{ $t('navbar.logout') }}</span>
          </el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import * as iPhone from '../../utils/iphone'
import Vue from 'vue'
import * as lnglat from '@/utils/lnglat'

export default {
  created() {
    Vue.$log.debug('Navbar created')
  },
  mounted() {
    Vue.$log.debug('Navbar mounted')
  },
  // eslint-disable-next-line vue/order-in-components
  computed: {
    ...mapGetters([
      'sidebar',
      'avatar',
      'device'
    ]),
    title() {
      return this.$t(this.$route.meta.title)
    },
    top() {
      return 'top:' + iPhone.getNavBarTop() + 'px'
    },
    isMobile() {
      return lnglat.isMobile()
    }
  },
  methods: {
    async logout() {
      await this.$store.dispatch('user/logout')
      this.$router.push(`/login?redirect=${this.$route.fullPath}`)
    }
  }
}
</script>

<style lang="scss" scoped>
  @import '../../styles/element-variables.scss';
  .navbar {
    height: 50px;
    width: calc(100vw - 64px);
    position: absolute;
    left: 64px;
    background: #f5f5f5;
    background: rgba(0, 0, 0, 0);
    z-index: 99;
  }
  .right-menu {
    float: right;
    height: 100%;
    line-height: 50px;

    &:focus {
      outline: none;
    }

    .right-menu-item {
      display: inline-block;
      padding: 0 8px;
      height: 100%;
      font-size: 18px;
      color: #5a5e66;
      vertical-align: text-bottom;

      &.hover-effect {
        cursor: pointer;
        transition: background .3s;

        &:hover {
          background: rgba(0, 0, 0, .025)
        }
      }
    }

    .avatar-container {
      margin-right:0;

      .avatar-wrapper {
        margin-top: 5px;
        position: relative;

        .user-avatar {
          cursor: pointer;
          width: 40px;
          height: 40px;
          border-radius: 10px;
        }
      }
    }
  }
.left {
  padding: 10px;
  float: left;
  font-size: larger;
  color: $--color-primary;
  opacity: 0.5;
  font-weight: bold;
}
</style>
