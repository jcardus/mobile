<template>
  <div class="navbar" :style="top">
    <hamburger id="hamburger-container" :is-active="sidebar.opened" class="hamburger-container" @toggleClick="toggleSideBar" />
    <div class="left-menu">
      <el-menu mode="horizontal">
        <el-submenu index="2">
          <template slot="title">{{ $t('route.reports') }}</template>
          <el-menu-item index="2-1"><router-link to="/map">{{ $t('route.map') }}</router-link></el-menu-item>
          <el-menu-item index="2-2"><router-link to="/map">{{ $t('route.map') }}</router-link></el-menu-item>
          <el-menu-item index="2-3"><router-link to="/map">{{ $t('route.map') }}</router-link></el-menu-item>
        </el-submenu>
      </el-menu>
    </div>
    <div class="right-menu">
      <template v-if="device!=='mobile'">
        <search id="header-search" class="right-menu-item" />
        <screenfull id="screenfull" class="right-menu-item hover-effect" />
      </template>
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
import Hamburger from '@/components/Hamburger'
import Screenfull from '@/components/Screenfull'
import Search from '@/components/HeaderSearch'
import * as iPhone from '../../utils/iphone'
import Vue from 'vue'

export default {
  components: {
    Hamburger,
    Screenfull,
    Search
  },
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
    top() {
      return 'top:' + iPhone.getNavBarTop() + 'px'
    }
  },
  methods: {
    toggleSideBar() {
      this.$store.dispatch('app/toggleSideBar')
    },
    async logout() {
      await this.$store.dispatch('user/logout')
      this.$router.push(`/login?redirect=${this.$route.fullPath}`)
    }
  }
}
</script>

<style lang="scss" scoped>

  .navbar {
    height: 50px;
    width: 100%;
    position: absolute;
    background: #f5f5f5;
    background: rgba(0, 0, 0, 0);
    z-index: 99;
  }

    .hamburger-container {
    line-height: 46px;
    height: 100%;
    float: left;
    cursor: pointer;
    transition: background .3s;
    -webkit-tap-highlight-color:transparent;

    &:hover {
      background: rgba(0, 0, 0, .025)
    }
  }
    .left-menu {
      float: left;
      height: 100%;
      line-height: 50px;

      &:focus {
        outline: none;
      }

      .left-menu-item {
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
        margin-right: 30px;

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

</style>
