<template>
  <div class="app-container" :style="top">
    <div v-if="user">
      <el-row :gutter="20">
        <el-col :span="12" :xs="24">
          <account></account>
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
  computed: {
    ...mapGetters(['user']),
    top() {
      if (('standalone' in window.navigator) && window.navigator.standalone) {
        return 'padding-top:70px;'
      }
      return 'padding-top:30px'
    }
  }
}
</script>
<style scoped>
  .app-container {
    padding-top: 10px;
    padding-right: 10px;
    padding-left: 10px;
  }
</style>
