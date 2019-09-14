<template>
  <el-card style="margin-bottom:20px;">
    <div slot="header" class="clearfix">
      <span>Account <span v-if="user.isAdmin">(Administrator)</span> </span>
    </div>
    <el-form>
      <el-form-item label="Name:">
        <el-input v-model.trim="user.name" />
      </el-form-item>
      <el-form-item label="Email:">
        <el-input v-model.trim="user.email" />
      </el-form-item>
      <el-form-item label="Timezone">
        <el-select v-model="selectedTimezone">
          <el-option v-for="timezone in timezones" :key="timezone.value" :value="timezone.value" :label="timezone.text" />
        </el-select>
      </el-form-item>
      <el-form-item label="Language">
        <el-select v-model="selectedLang">
          <el-option v-for="lang in languages" :key="lang.value" :value="lang.value" :label="lang.text" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="submit">Update</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script>
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
      /*
                this.user.name
                this.user.email
                this.selectedLang
                this.selectedTimezone*/
      // TODO Call update user
      // TODO globalizar

      this.$message({
        message: 'User information has been updated successfully',
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
