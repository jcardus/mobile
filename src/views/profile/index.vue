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
import { mapGetters } from 'vuex'
import Account from './components/Account'

export default {
  name: 'Profile',
  components: { Account },
  data() {
    return {
      user: {}
    }
  },
  computed: {
    ...mapGetters([
      'token'
    ])
  },
  created() {
    this.getUser()
  },
  methods: {
    getUser() {
      this.user = {
        name: this.token.name,
        email: this.token.email,
        isAdmin: this.token.administrator,
        timezone: this.token.attributes.timezone,
        language: this.token.attributes.lang
      }
    }
  }
}
</script>
