<template>
  <el-card style="margin-bottom:20px;">
    <div slot="header" class="clearfix">
      <span>{{ $t('profile.user_account') }} <span v-if="userForm.isAdmin">(Administrator)</span> </span>
    </div>
    <el-form ref="user" :model="userForm" :rules="rules" label-width="120px">
      <el-form-item :label="$t('profile.user_name')" prop="name">
        <el-input v-model="userForm.name" />
      </el-form-item>
      <el-form-item :label="$t('profile.user_email')" prop="email">
        <el-input v-model="userForm.email" />
      </el-form-item>
      <el-form-item :label="$t('profile.user_password')" prop="password">
        <el-input
          ref="password"
          :key="passwordType"
          v-model="userForm.password"
          name="password"
          :type="passwordType"
        />
        <span class="show-pwd" @click="showPwd">
          <svg-icon :icon-class="passwordType === 'password' ? 'eye' : 'eye-open'" />
        </span>

      </el-form-item>
      <el-form-item :label="$t('profile.user_phone')">
        <el-input v-model="userForm.phone" />
      </el-form-item>
      <el-form-item :label="$t('profile.user_timezone')">
        <el-select v-model="selectedTimezone">
          <el-option v-for="timezone in timezones" :key="timezone.value" :value="timezone.value" :label="timezone.text" />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('profile.user_language')">
        <el-select v-model="selectedLang">
          <el-option v-for="lang in languages" :key="lang.value" :value="lang.value" :label="lang.text" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="submit">{{ $t('profile.user_update_button') }}</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script>
import { traccar } from '../../../api/traccar-api'
import { setLanguage } from '../../../lang'
import { mapGetters } from 'vuex'

export default {
  name: 'Account',
  data() {
    return {
      userForm: {
        name: '',
        email: '',
        password: '',
        isAdmin: false,
        phone: '',
        lang: '',
        timezone: ''
      },
      selectedLang: '',
      languages: [
        { value: 'en-GB', text: 'English (UK)' },
        { value: 'fr-FR', text: 'Française (Frace)' },
        { value: 'es-CL', text: 'Español (Chile)' },
        { value: 'pt-PT', text: 'Português (PT)' },
        { value: 'pt-BR', text: 'Português (BR)' }
      ],
      selectedTimezone: '',
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
      passwordType: 'password'
    }
  },
  computed: {
    ...mapGetters(['user'])
  },
  created() {
    this.userForm.name = this.user.name
    this.userForm.email = this.user.email
    this.userForm.phone = this.user.phone
    this.selectedLang = this.user.attributes.lang
    this.selectedTimezone = this.user.attributes.timezone
  },
  methods: {
    submit() {
      this.$refs.user.validate(valid => {
        if (valid) {
          const newUser = { id: this.user.userId }
          newUser.name = this.userForm.name
          newUser.email = this.userForm.email
          newUser.password = this.userForm.password
          newUser.phone = this.userForm.phone
          newUser.attributes = {
            timezone: this.selectedTimezone,
            lang: this.selectedLang
          }
          traccar.updateUser(newUser.id, newUser, this.userUpdated)
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
    },
    userUpdated: function(user) {
      setLanguage(user.attributes.lang)
      this.$message({
        message: this.$t('profile.user_updated'),
        type: 'success',
        duration: 5 * 1000
      })
    }
  }
}
</script>

<style lang="scss">
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
