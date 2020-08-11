<template>
  <div>
    <div class="right-menu">
      <el-dropdown trigger="click" @command="handleCommand">
        <span class="el-dropdown-link">
          <el-avatar size="large">{{ avatar }}</el-avatar>
        </span>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item command="profile">{{ $t('navbar.profile') }}</el-dropdown-item>
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
      <div v-if="offline">Offline...</div>
    </div>
    <el-dialog v-if="user.id !== 0" :title="$t('profile.user_account')" :visible.sync="dialogVisible" :before-close="handleClose" @open="dirty=false">
      <el-form ref="user" :model="user" :rules="rules" label-width="auto">
        <el-form-item :label="$t('profile.user_name')" prop="name">
          <el-input v-model="user.name" @input="dirty=true" />
        </el-form-item>
        <el-form-item :label="$t('profile.user_email')" prop="email">
          <el-input v-model="user.email" @input="dirty=true" />
        </el-form-item>
        <el-form-item :label="$t('profile.user_password')" prop="password">
          <el-input
            :key="passwordType"
            ref="password"
            v-model="user.password"
            :show-password="true"
            :type="passwordType"
            name="password"
            @input="dirty=true"
          />
        </el-form-item>
        <el-form-item :label="$t('profile.user_phone')">
          <el-input v-model="user.phone" @input="dirty=true" />
        </el-form-item>
        <el-form-item :label="$t('profile.user_timezone')">
          <el-select v-model="user.attributes.timezone" @change="dirty=true">
            <el-option v-for="timezone in timezones" :key="timezone.value" :label="timezone.text" :value="timezone.value" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('profile.user_language')">
          <el-select v-model="user.attributes.lang" @change="dirty=true">
            <el-option v-for="lang in languages" :key="lang.value" :label="lang.text" :value="lang.value" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('profile.user_reports')">
          <el-tooltip :content="$t('profile.inactive_vehicles_email_tooltip')">
            <el-switch v-model="user.attributes.inactiveVehiclesEmail" :active-text="$t('profile.inactive_vehicles_email')" style="padding-right:10px" @change="dirty=true"></el-switch>
          </el-tooltip>
          <el-tooltip :content="$t('profile.daily_reports_tooltip')">
            <el-switch v-model="user.attributes.dailyEmails" :active-text="$t('profile.daily_reports')" style="padding-right:10px" @change="dirty=true"></el-switch>
          </el-tooltip>
          <el-tooltip class="item" :content="$t('profile.weekly_reports_tooltip')">
            <el-switch v-model="user.attributes.weeklyEmails" :active-text="$t('profile.weekly_reports')" style="padding-right:10px" @change="dirty=true"></el-switch>
          </el-tooltip>
          <el-tooltip class="item" :content="$t('profile.monthly_reports_tooltip')">
            <el-switch v-model="user.attributes.monthlyEmails" :active-text="$t('profile.monthly_reports')" @change="dirty=true"></el-switch>
          </el-tooltip>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button :loading="loading" type="primary" :disabled="!dirty" @click="submit">{{ $t('profile.user_update_button') }}</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { appOffline } from '@/utils/utils'
import { vm } from '@/main'
import { traccar } from '@/api/traccar-api'
import { setLanguage } from '@/lang'

export default {
  name: 'Profile',
  data() {
    return {
      dirty: false,
      dialogVisible: false,
      languages: [
        { value: 'en-GB', text: 'English (UK)' },
        { value: 'fr-FR', text: 'Française (Frace)' },
        { value: 'es-CL', text: 'Español (Chile)' },
        { value: 'pt-PT', text: 'Português (PT)' },
        { value: 'pt-BR', text: 'Português (BR)' }
      ],
      timezones: [
        { value: 'Europe/Lisbon', text: 'Europe/Lisbon' },
        { value: 'America/Santiago', text: 'America/Santiago' },
        { value: 'Africa/Luanda', text: 'Africa/Luanda' },
        { value: 'America/Sao_Paulo', text: 'America/São Paulo' }
      ],
      rules: {
        name: [
          { required: true, message: this.$t('profile.user_name_required'), trigger: 'blur' }
        ],
        email: [
          { type: 'email', required: true, message: this.$t('profile.user_email_required'), trigger: 'blur' }
        ],
        password: [
          { required: true, min: 6, message: this.$t('profile.user_password_lengh'), trigger: 'blur' }
        ]
      },
      passwordType: 'password',
      loading: false
    }
  },
  computed: {
    ...mapGetters(['avatar', 'user']),
    offline() { return appOffline() }
  },
  loading: {
    get() {
      return vm.$data.loading
    },
    set(value) {
      vm.$data.loading = value
    }
  },
  methods: {
    handleClose(done) {
      if (this.dirty) {
        this.$confirm(this.$t('profile.unsaved_changes'), this.$t('profile.continue'))
          .then(() => { done() })
          .catch(() => {})
      } else {
        done()
      }
    },
    async logout() {
      await this.$store.dispatch('app/setLoading', true)
      await this.$store.dispatch('user/logout')
      await this.$store.dispatch('app/setLoading', false)
      window.location.reload()
    },
    handleCommand(command) {
      if (command === 'profile') {
        this.$store.dispatch('user/getUser').finally(() => { this.dialogVisible = true })
      }
    },
    submit() {
      this.$refs.user.validate(valid => {
        if (valid) {
          this.loading = true
          traccar.updateUser(this.user.id, this.user
          ).then(({ data }) => {
            this.dirty = false
            setLanguage(data.attributes.lang)
            this.$message({
              message: this.$t('profile.user_updated'),
              type: 'success',
              duration: 5 * 1000
            })
          }).catch((e) => {
            this.$message({
              message: e,
              type: 'error',
              duration: 5 * 1000
            })
          }).finally(() => { this.loading = false })
        }
      })
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
    }
  }
}
</script>

<style lang="scss">
  @import '../../styles/element-variables.scss';
  .el-avatar {
    color:$--color-text-regular;
    background-color:$--color-info-lighter;
    opacity: 0.95;
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
  $dark_gray:#889aa4;

  .show-pwd {
    position: absolute;
    right: 10px;
    top: 1px;
    font-size: 16px;
    color: $dark_gray;
    cursor: pointer;
    user-select: none;
  }

</style>
