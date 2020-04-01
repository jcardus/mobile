<template>
  <div class="app-container" :style="top">
    <div v-if="user">
      <el-row :gutter="20">
        <el-col :span="12" :xs="24">
          <account :user="user" />
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script>
import Account from './components/Account'
import { mapGetters } from 'vuex'

export default {
  name: 'Profile',
  components: { Account },
  data() {
    return {
      user: {}
    }
  },
  computed: {
    ...mapGetters(['user']),
    top() {
      if (('standalone' in window.navigator) && window.navigator.standalone) {
        return 'padding-top:100px;'
      }
      return 'padding-top:60px'
    }
  },
  created() {
    this.getUser()
  },
  methods: {
    getUser() {
      this.user = {
        name: this.user.name,
        email: this.user.email,
        password: this.user.password,
        phone: this.user.phone,
        timezone: this.user.attributes.timezone,
        language: this.user.attributes.lang
      }
    }
  }
}
</script>
<style scoped>
  .app-container {
    padding-top: 60px;
    padding-right: 10px;
    padding-left: 10px;
  }
</style>
