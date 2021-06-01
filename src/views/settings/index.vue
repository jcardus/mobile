<template>
  <div class="app-container">
    <div style="height: 10px"></div>
    <el-tabs
      active-tab-color="#9b59b6"
      active-text-color="white"
    >
      <el-tab-pane>
        <span slot="label">
          <i class="fas fa-car"></i><span v-if="!isMobile" style="margin-left: 10px">{{ $t('settings.vehicles') }}</span>
        </span>
        <vehicles></vehicles>
      </el-tab-pane>
      <el-tab-pane>
        <span slot="label">
          <i class="fas fa-grip-horizontal"></i><span v-if="!isMobile" style="margin-left: 10px">{{ $t('settings.groups') }}</span>
        </span>
        <groups></groups>
      </el-tab-pane>
      <el-tab-pane>
        <span slot="label">
          <i class="fas fa-address-card"></i><span v-if="!isMobile" style="margin-left: 10px">{{ $t('settings.drivers') }}</span>
        </span>
        <drivers></drivers>
      </el-tab-pane>
      <el-tab-pane>
        <span slot="label">
          <i class="fas fa-user-friends"></i><span v-if="!isMobile" style="margin-left: 10px">{{ $t('settings.users') }}</span>
        </span>
        <users></users>
      </el-tab-pane>
      <el-tab-pane>
        <span slot="label">
          <i class="fas fa-user-clock"></i><span v-if="!isMobile" style="margin-left: 10px">{{ $t('settings.temporary_links') }}</span>
        </span>
        <temporary-links></temporary-links>
      </el-tab-pane>
      <el-tab-pane>
        <span slot="label">
          <i class="fas fa-map-marked"></i><span v-if="!isMobile" style="margin-left: 10px">{{ $t('settings.zone') }}</span>
        </span>
        <geofences></geofences>
      </el-tab-pane>
      <el-tab-pane>
        <span slot="label">
          <i class="fas fa-bell"></i><span v-if="!isMobile" style="margin-left: 10px">{{ $t('settings.alerts') }}</span>
        </span>
        <alerts></alerts>
      </el-tab-pane>
      <el-tab-pane>
        <span slot="label">
          <i class="fas fa-sticky-note"></i><span v-if="!isMobile" style="margin-left: 10px">{{ $t('settings.reports') }}</span>
        </span>
        <automatic-reports></automatic-reports>
      </el-tab-pane>
      <el-tab-pane>
        <span slot="label">
          <i class="fas fa-map"></i><span v-if="!isMobile" style="margin-left: 10px">{{ $t('settings.map') }}</span>
        </span>
        <h3>{{ $t('settings.vehicles') }}</h3>
        <div>
          <el-switch
            v-model="showLabels"
            :active-text="$t('settings.showLabels')"
            inactive-text=""
          >
          </el-switch>
        </div>
        <div style="margin-top: 20px">
          <el-switch
            v-model="icons3d"
            :active-text="$t('settings.icons3d')"
            inactive-text=""
          >
          </el-switch>
        </div>
        <h3>{{ $t('settings.route_history') }}</h3>
        <div>
          <el-switch
            v-model="matchRoutes"
            :active-text="$t('settings.route_match')"
            inactive-text=""
          >
          </el-switch>
        </div>
        <div style="margin-top: 20px">
          <el-switch
            v-model="viewSpeedAlerts"
            :active-text="$t('settings.view_speed_alerts')"
            inactive-text=""
          >
          </el-switch>
        </div>
        <el-form :disabled="!viewSpeedAlerts" style="padding-left: 25px; margin-top: 10px">
          <el-radio-group :value="radioValue" @input="changeMaxSpeedType">
            <div style="margin-top: 20px">
              <el-radio label="road">{{ $t('settings.use_route_speed_limit') }}</el-radio>
            </div>
            <div style="margin-top: 10px">
              <el-radio label="vehicle">{{ $t('settings.use_vehicle_speed_limit') }}</el-radio>
            </div>
          </el-radio-group>
          <div style="margin-top: 20px">
            <span class="text_max_speed">{{ $t('settings.max_speed_threshold') }}<el-input v-model="speedThreshold" type="number" min="0" style="margin-left: 5px; width: 100px;" @change="changeSpeedThreshold" /></span>
          </div>
        </el-form>

      </el-tab-pane>
      <el-tab-pane>
        <span slot="label">
          <i class="fas fa-user"></i><span v-if="!isMobile" style="margin-left: 10px">{{ $t('navbar.profile') }}</span>
        </span>
        <h3>{{ $t('profile.user_account') }}</h3>
        <el-form ref="user" :model="user" :rules="rules" label-width="120px">
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
        </el-form>
        <el-button :loading="loading" type="primary" :disabled="!dirty" @click="submit">{{ $t('profile.user_update_button') }}</el-button>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import { vm } from '@/main'
import Users from './users/Users'
import Alerts from './alerts/Alerts'
import Drivers from './drivers/Drivers'
import Geofences from './geofence/Geofences'
import Vehicles from './vehicles/Vehicles'
import Groups from './groups/Groups'
import TemporaryLinks from './links/TemporaryLinks'
import AutomaticReports from './reports/AutomaticReports.vue'
import * as lnglat from '../../utils/lnglat'
import { mapGetters } from 'vuex'
import { languages, setLanguage } from '@/lang'
import { timezones } from '@/utils/consts'
import { traccar } from '@/api/traccar-api'

export default {
  name: 'Settings',
  components: { Users, Alerts, Vehicles, Groups, Drivers, Geofences, AutomaticReports, TemporaryLinks },
  data() {
    return {
      radioValue: 'road',
      speedThreshold: 0,
      dirty: false,
      loading: false,
      languages: languages,
      timezones: timezones,
      passwordType: 'password',
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
  computed: {
    ...mapGetters(['vehicles3dEnabled', 'user']),
    showLabels: {
      get() { return this.$store.state.settings.showLabels },
      set(value) {
        this.$store.dispatch('settings/setShowLabels', value)
      }
    },
    top() {
      if (('standalone' in window.navigator) && window.navigator.standalone) {
        return 'padding-top:100px;'
      }
      return 'padding-top:15px'
    },
    isMobile() { return lnglat.isMobile() },
    matchRoutes: {
      get() { return this.$store.state.settings.matchRoutes },
      set(value) {
        this.$store.dispatch('settings/changeSetting', {
          key: 'matchRoutes',
          value: value
        })
      }
    },
    viewSpeedAlerts: {
      get() { return this.$store.state.settings.viewSpeedAlerts },
      set(value) {
        this.$store.dispatch('settings/changeSetting', {
          key: 'viewSpeedAlerts',
          value: value
        })
      }
    },
    icons3d: {
      get() { return this.vehicles3dEnabled },
      set(value) {
        this.$store.dispatch('settings/changeSetting', {
          key: 'vehicles3d',
          value: value
        })
      }
    }
  },
  mounted() {
    this.radioValue = vm.$store.state.settings.maxSpeedType
    this.speedThreshold = vm.$store.state.settings.speedThreshold
  },
  methods: {
    changeMaxSpeedType(data) {
      this.radioValue = data
      this.$store.dispatch('settings/changeSetting', {
        key: 'maxSpeedType',
        value: data
      })
    },
    changeSpeedThreshold() {
      this.$store.dispatch('settings/changeSetting', {
        key: 'speedThreshold',
        value: this.speedThreshold
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
    }
  }
}
</script>

<style lang="scss" scoped>
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
.app-container {
    padding-left: 10px;
  }

  .text_max_speed {
    font-size: 14px;
    color: #055AE5;
  }

</style>

