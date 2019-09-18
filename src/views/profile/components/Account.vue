<template>
  <el-card style="margin-bottom:20px;">
    <div slot="header" class="clearfix">
      <span>{{ $t('profile.user_account') }} <span v-if="user.isAdmin">(Administrator)</span> </span>
    </div>
    <el-form>
      <el-form-item :label="$t('profile.user_name')">
        <el-input v-model.trim="user.name" />
      </el-form-item>
      <el-form-item :label="$t('profile.user_email')">
        <el-input v-model.trim="user.email" />
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
import { mapGetters } from 'vuex'
import { setToken } from '@/utils/auth' // get token from cookie
import { setLanguage } from '../../../lang'

export default {
  props: {
    user: {
      type: Object,
      default: () => {
        return {
          name: '',
          email: '',
          isAdmin: '',
          timezone: '',
          language: ''
        }
      }
    }
  },
  computed: {
    ...mapGetters([
      'token'
    ])
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
      ]
    }
  },
  methods: {
    submit() {
      var newUser = this.token
      newUser.name = this.user.name
      newUser.email = this.user.email
      newUser.attributes.lang = this.selectedLang
      newUser.attributes.timezone = this.selectedTimezone

      traccar.updateUser(this.token.id, newUser, this.userUpdated)
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

<style lang="scss" scoped>
  .box-center {
    margin: 0 auto;
    display: inline;
  }

  .text-muted {
    color: #777;
  }

  .user-profile {
    .user-name {
      font-weight: bold;
    }

    .box-center {
      padding-top: 10px;
    }

    .user-role {
      padding-top: 10px;
      font-weight: 400;
      font-size: 14px;
    }

    .box-social {
      padding-top: 30px;

      .el-table {
        border-top: 1px solid #dfe6ec;
      }
    }

    .user-follow {
      padding-top: 20px;
    }
  }

  .user-bio {
    margin-top: 20px;
    color: #606266;

    span {
      padding-left: 4px;
    }

    .user-bio-section {
      font-size: 14px;
      padding: 15px 0;

      .user-bio-section-header {
        border-bottom: 1px solid #dfe6ec;
        padding-bottom: 10px;
        margin-bottom: 10px;
        font-weight: bold;
      }
    }
  }
</style>
