<template>
  <div class="block">
    <el-card>
      <div slot="header" class="clearfix">
        <span>{{ $t('alerts.title') }}</span>
      </div>
      <el-row :gutter="20">
        <el-col style="padding-bottom: 5px" :span="16">
          <el-select
            v-model="selectedAlertsType"
            style="width: 100%; height: 35px"
            multiple
            :placeholder="$t('alerts.title')"
            value=""
          >
            <el-option v-for="item in alerts" :key="item.notification.id" :label="$t('settings.alert_'+item.notification.type)" :value="item.notification.id" />
          </el-select>
        </el-col>
        <el-col :span="2">
          <div class="grid-content">
            <el-tooltip :content="$t('alerts.get_alerts')" placement="bottom">
              <el-button type="primary" icon="el-icon-caret-right" circle @click="getNotifications" />
            </el-tooltip>
          </div>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="16">
          <div class="grid-content">
            <el-tooltip content="Select period" placement="bottom">
              <el-date-picker
                v-model="dateRange"
                style="width: 100%"
                type="daterange"
                align="right"
                unlink-panels
                range-separator="-"
                format="dd-MM-yyyy"
                start-placeholder="Start date"
                end-placeholder="End date"
                :picker-options="pickerOptions"
                :default-time="['00:00:00', '23:59:59']"
              />
            </el-tooltip>
          </div>
        </el-col>
      </el-row>
      <el-timeline style="margin-top: 20px">
        <el-timeline-item v-for="(item,index) of sortedItems" :key="index" :icon="item.image" :color="item.color" size="large" placement="bottom">
          <div style="margin-right: 5px; margin-bottom: 5px; font-weight: bold">{{ item.type }}</div>
          <div style="margin-bottom: 5px; font-size: 13px">{{ item.timestamp }}</div>
          <div style="margin-right: 5px">{{ item.title }}<span></span>{{ item.content }}</div>
        </el-timeline-item>
      </el-timeline>
    </el-card>
  </div>
</template>

<script>
import { vm } from '../../main'
import { mapGetters } from 'vuex'

const alertTypes = [
  'geofenceExit',
  'geofenceEnter',
  'deviceOverspeed',
  'ignitionOn',
  'ignitionOff'
]

export default {
  data() {
    return {
      selectedAlertsType: [],
      selectedDevices: [],
      selectedNotifications: [],
      pickerOptions: {
        shortcuts: [{
          text: 'Today',
          onClick(picker) {
            const end = new Date()
            const start = new Date()
            end.setHours(23)
            end.setMinutes(59)
            end.setSeconds(59)
            start.setHours(0)
            start.setMinutes(0)
            start.setSeconds(0)
            picker.$emit('pick', [start, end])
          }
        }, {
          text: 'Yesterday',
          onClick(picker) {
            const end = new Date()
            const start = new Date()
            end.setTime(start.getTime() - 3600 * 1000 * 24)
            start.setTime(start.getTime() - 3600 * 1000 * 24)
            end.setHours(23)
            end.setMinutes(59)
            end.setSeconds(59)
            start.setHours(0)
            start.setMinutes(0)
            start.setSeconds(0)
            picker.$emit('pick', [start, end])
          }
        }, {
          text: 'Last week',
          onClick(picker) {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
            picker.$emit('pick', [start, end])
          }
        }],
        firstDayOfWeek: 1
      },
      dateRange: []
    }
  },
  computed: {
    ...mapGetters(['events', 'alerts', 'devices']),
    geofences: function() { return vm.$store.state.user.geofences },
    sortedItems: function() {
      return this.events.filter(e => {
        alertTypes.includes(e.type)
      }).slice().sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    }
  },
  mounted() {
    const end = new Date()
    const start = new Date()
    end.setHours(23)
    end.setMinutes(59)
    end.setSeconds(59)
    start.setHours(0)
    start.setMinutes(0)
    start.setSeconds(0)
    this.dateRange = [start, end]
    this.selectedDevices = this.$store.getters.devices.map(d => d.id)
  },
  methods: {
    getNotifications() {
      this.timeline = []
      this.alerts.forEach(a => {
        if (this.selectedAlertsType.length === 0 ||
                    this.selectedAlertsType.find(element => element === a.notification.id) != null) {
          this.getAlertNotifications(a)
        }
      })
    },
    getAlertNotifications() {
      if (this.dateRange.length > 0) {
        this.$store.dispatch('transient/fetchEvents', {
          start: this.dateRange[0],
          end: this.dateRange[1],
          types: this.alerts.filter(a => this.selectedAlertsType.find(e => e === a.notification.id))
        })
      }
    }
  }
}
</script>
