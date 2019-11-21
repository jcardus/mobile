<template>
  <div class="app-container">
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
import { getToken } from '@/utils/auth' // get token from cookie

export default {
  name: 'Profile',
  components: { Account },
  data() {
    return {
      user: {}
    }
  },
  created() {
    this.getUser()
  },
  methods: {
    getUser() {
      const token = getToken()
      this.user = {
        name: token.name,
        email: token.email,
        password: token.password,
        isAdmin: token.administrator,
        phone: token.phone,
        timezone: token.attributes.timezone,
        language: token.attributes.lang
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
