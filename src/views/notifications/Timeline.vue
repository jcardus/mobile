<template>
  <div class="block">
    <el-card>
      <div slot="header" class="clearfix">
        <span>Notificações</span>
      </div>
      <el-row :gutter="20">
        <el-col style="padding-bottom: 5px" :span="16">
          <el-select
            v-model="selectedAlertsType"
            style="width: 100%; height: 35px"
            multiple
            placeholder="Alertas"
            value=""
          >
            <el-option v-for="item in alerts" :key="item.notification.id" :label="$t('settings.alert_'+item.notification.type)" :value="item.notification.id" />
          </el-select>
        </el-col>
        <el-col :span="2">
          <div class="grid-content">
            <el-tooltip content="Obter Notificações" placement="bottom">
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
import { traccar } from '../../api/traccar-api'
import { vm } from '../../main'

export default {
  data() {
    return {
      timeline: [],
      selectedAlertsType: [],
      selectedDevices: [],
      selectedNotifications: [],
      alerts: [],
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
    devices: function() { return vm.$data.devices },
    geofences: function() { return vm.$data.geofences },
    sortedItems: function() {
      return this.timeline.slice().sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    }
  },
  mounted() {
    if (this.alerts.length === 0) {
      traccar.alerts(this.loadAlerts)
    }

    const end = new Date()
    const start = new Date()
    end.setHours(23)
    end.setMinutes(59)
    end.setSeconds(59)
    start.setHours(0)
    start.setMinutes(0)
    start.setSeconds(0)
    this.dateRange = [start, end]
    this.selectedDevices = vm.$data.devices.map(d => d.id)
  },
  methods: {
    loadAlerts: function(alerts) {
      const self = this
      const result = []
      alerts.sort((a, b) => (a.type > b.type) ? 1 : -1).forEach(a => {
        const alarm_data = {
          notification: a,
          devices: []
        }
        result.push(alarm_data)
      })
      this.alerts = result

      this.devices.forEach(d => {
        traccar.alertsByDevice(d.id, function(alerts) {
          alerts.forEach(a => {
            const alert = self.alerts.find(a_data => a_data.notification.id === a.id)
            if (a.always === false) {
              alert.devices.push({ data: d })
            }
          })
        })
      })

      this.alerts.forEach(a => {
        if (a.notification.always === true) {
          self.devices.forEach(d => {
            a.devices.push({ data: d })
          })
        }
      })

      this.getNotifications()
    },
    getNotifications() {
      this.timeline = []
      this.alerts.forEach(a => {
        if (this.selectedAlertsType.length === 0 ||
                    this.selectedAlertsType.find(element => element === a.notification.id) != null) {
          this.getAlertNotifications(a)
        }
      })
    },
    getAlertNotifications(a) {
      if (this.dateRange.length > 0) {
        const start = this.dateRange[0].toISOString().replace(' ', 'T').substring(0, 19) + 'Z'
        const end = this.dateRange[1].toISOString().replace(' ', 'T').substring(0, 19) + 'Z'
        this.$log.debug(a)
        const devices = a.devices.map(d => d.data.id)
        this.$log.debug(devices)

        traccar.report_events(start, end, devices, [a.notification.type], this.notificationReceived)
      }
    },
    notificationReceived: function(data) {
      const self = this
      // const result = []
      // data =  data.sort("serverTime", "asc");
      data.forEach(function(notification) {
        var vehicle = vm.$data.devices.filter(d => d.id === notification.deviceId)[0]
        var entry = {
          timestamp: notification.serverTime.substring(0, 19).replace('T', ' '),
          title: vehicle.name,
          content: self.getNotificationContent(notification),
          type: self.$t('settings.alert_' + notification.type),
          image: self.getNotificationImage(notification.type),
          color: self.getNotificationColor(notification.type)
        }
        self.timeline.push(entry)
      })
      // this.timeline = result
    },
    getNotificationImage: function(type) {
      if (type === 'ignitionOn' || type === 'ignitionOff') {
        return 'fas fa-key'
      }
      if (type === 'geofenceEnter' || type === 'geofenceExit') {
        return 'fas fa-draw-polygon'
      }
      if (type === 'deviceOverspeed') {
        return 'fas fa-shipping-fast'
      }

      return ''
    },
    getNotificationColor: function(type) {
      if (type === 'ignitionOn' || type === 'geofenceEnter') {
        return 'green'
      }
      if (type === 'ignitionOff' || type === 'geofenceExit') {
        return 'red'
      }
      return 'black'
    },
    getNotificationContent: function(notification) {
      if (notification.type === 'geofenceExit' || notification.type === 'geofenceEnter') {
        const geofence = this.geofences.find(g => g.id === notification.geofenceId)

        return ' >> ' + geofence.name
      }
      if (notification.type === 'deviceOverspeed') {
        return ' >> ' + Math.round(notification.attributes.speed * 1.85200) + ' Km/h'
      }
      return ''
    }
  }
}
</script>
<style>
  .el-card__body{
    padding: 10px;
  }
  .el-timeline-item__node--large {
    width: 18px;
    height: 18px;
  }
</style>

