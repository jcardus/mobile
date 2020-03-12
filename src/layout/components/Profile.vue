<template>
  <div class="right-menu">
    <div v-if="offline">Offline...</div>
    <el-dropdown trigger="click">
      <span class="el-dropdown-link">
        <el-avatar size="large">{{ avatar }}</el-avatar>
      </span>
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
</template>

<script>
import { mapGetters } from 'vuex'
import { appOffline } from '../../utils/utils'

export default {
  name: 'Profile',
  computed: {
    ...mapGetters([
      'avatar'
    ]),
    offline() {
      return appOffline()
    }
  },
  methods: {
    async logout() {
      this.loading = true
      await this.$store.dispatch('user/logout')
      this.loading = false
      this.$router.push(`/login?redirect=${this.$route.fullPath}`)
    }
  }
}
</script>

<style lang="scss" scoped>
  @import '../../styles/element-variables.scss';
  .el-avatar {
    color:$--color-text-regular;
    background-color:white;
    opacity: 0.9;
    font-weight: bold;
  }
  a:link {
    text-decoration: none;
  }
  .right-menu {
      position: absolute;
      right: 15px;
    top:15px;
      background: rgba(0, 0, 0, 0);
      z-index: 99;
  }

</style>
