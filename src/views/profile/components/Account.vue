<template>
  <el-card style="margin-bottom:20px;">
    <div slot="header" class="clearfix">
      <span>{{ $t('profile.user_account') }} <span v-if="user.isAdmin">(Administrator)</span> </span>
    </div>
    <el-form ref="user" :model="user" :rules="rules" label-width="120px">
      <el-form-item :label="$t('profile.user_name')" prop="name">
        <el-input v-model="user.name" />
      </el-form-item>
      <el-form-item :label="$t('profile.user_email')" prop="email">
        <el-input v-model="user.email" />
      </el-form-item>
      <el-form-item :label="$t('profile.user_password')" prop="password">
        <el-input ref="password" v-model="user.password" name="password" type="password" />
      </el-form-item>
      <el-form-item :label="$t('profile.user_phone')">
        <el-input v-model="user.phone" />
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
import { setToken, getToken } from '@/utils/auth' // get token from cookie
import { setLanguage } from '../../../lang'
var token = getToken()

export default {
  props: {
    user: {
      type: Object,
      default: () => {
        return {
          name: '',
          email: '',
          password: '',
          phone: '',
          isAdmin: '',
          timezone: '',
          language: ''
        }
      }
    }
  },
  data() {
    return {
      selectedLang: this.user.language,
      languages: [
        { value: 'en-GB', text: 'English (UK)' },
        { value: 'fr-FR', text: 'Française (Frace)' },
        { value: 'es-CL', text: 'Español (Chile)' },
        { value: 'pt-PT', text: 'Português (PT)' },
        { value: 'pt-BR', text: 'Português (BR)' }
      ],
      selectedTimezone: this.user.timezone,
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
      }
    }
  },
  methods: {
    submit() {
      this.$refs.user.validate(valid => {
        if (valid) {
          var newUser = token
          newUser.name = this.user.name
          newUser.email = this.user.email
          newUser.password = this.user.password
          newUser.phone = this.user.phone
          newUser.attributes.lang = this.selectedLang
          newUser.attributes.timezone = this.selectedTimezone

          traccar.updateUser(token.id, newUser, this.userUpdated)
        }
      })
    },
    userUpdated: function(user) {
      setToken(user)
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
