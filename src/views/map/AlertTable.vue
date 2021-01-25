<template>
  <div>
    <el-select
      v-model="selectedAlertType"
      clearable
      style="width: 100%; margin-bottom: 3px"
      :placeholder="$t('alerts.title')"
      value=""
    >
      <el-option v-for="item in alerts" :key="item.notification.id" :label="$t('settings.alert_'+getAlertType(item))" :value="item" />
    </el-select>
    <div v-if="!historyMode">
      <el-select
        v-model="alertsSearchPeriod"
        style="margin-bottom: 5px; width: 100%"
        @change="getAlerts"
      >
        <el-option
          v-for="item in alertsSearchPeriods"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        >
        </el-option>
      </el-select>
    </div>
    <div class="mobileScroll">
      <el-table
        id="alertTable"
        v-loading="loading"
        v-el-table-infinite-scroll="load"
        style="padding: 5px"
        :cell-style="cellStyle"
        :data="filteredEvents"
        :show-header="false"
        :height="height"
        highlight-current-row
        stripe
        @row-click="alertSelected"
      >
        <el-table-column
          prop="name"
          label=""
          width="5"
          heigth="10"
        >
        </el-table-column>
        <el-table-column
          prop="name"
          sortable=""
          heigth="1"
        >
          <template slot-scope="scope">
            <div style="padding: 10px 0">
              <div style="line-height: normal"><i :style="'width: 20px; font-size: 12px; color: '+(scope.row.color ? scope.row.color : '#3232b4')" :class="scope.row.image"></i><span style="font-weight: bold">{{ scope.row.description }}</span></div>
              <div style="line-height: normal"><span style="font-size: 12px"><i class="fas fa-car listIcon" style="width: 20px"></i>{{ scope.row.device.name }}</span></div>
              <div style="line-height: normal">
                <span style="font-size: 12px">
                  <i v-if="scope.row.device.driver.name !== ''" class="fas fa-user driverIcon"></i>
                  {{ scope.row.device.driver.name }}
                </span>
              </div>
              <div style="line-height: normal">
                <span style="font-size: 12px">
                  <i v-if="scope.row.type === 'geofenceExit' || scope.row.type === 'geofenceEnter'" class="fas fa-map-marked listIcon" style="width: 20px"></i>
                  <i v-if="scope.row.type === 'deviceOverspeed'" class="fas fa-tachometer-alt listIcon" style="width: 20px"></i>
                  {{ scope.row.content }}
                </span>
              </div>
              <div style="line-height: normal; font-size: 12px">
                <i class="fas fa-clock listIcon" style="width: 20px"></i>{{ scope.row.serverTime | moment('from', currentTime) }}
              </div>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script>
import { serverBus, vm } from '@/main'
import styles from '../../styles/element-variables.scss'
import { mapGetters } from 'vuex'
import Vue from 'vue'
import * as alertType from '../../alerts/alertType'
import * as event from '@/events'

export default {
  name: 'AlertTable',
  props: {
    filterKey: {
      default: '',
      type: String
    }
  },
  data() {
    return {
      selectedAlertType: '',
      alertsSearchPeriod: 'last_one_hour',
      selected: false,
      loading: false,
      count: 10
    }
  },
  computed: {
    ...mapGetters(['historyMode', 'currentTime', 'events', 'alerts', 'devices']),
    height() {
      return 'calc(100vh - ' + styles.alertListHeaderHeight + ')'
    },
    map: function() {
      return vm.$static.map
    },
    filteredEvents: function() {
      // const self = this
      const filterKey = this.filterKey && this.filterKey.toLowerCase()
      let events = this.events.filter(e => alertType.alertTypes.includes(e.type))
      if (filterKey) {
        events = events.filter(function(row) {
          return Object.keys(row).some(function(key) {
            return String(row[key]).toLowerCase().indexOf(filterKey) > -1
          })
        })
      }
      if (this.selectedAlertType) {
        const alertType = this.getAlertType(this.selectedAlertType)
        events = events.filter(e => e.type === alertType)
      }
      events = events.sort((a, b) => {
        return (a.timestamp === b.timestamp ? 0 : a.timestamp > b.timestamp ? -1 : 1)
      })
      return events.slice(0, this.count)
    },
    getVehicleName(row) {
      if (row.vehicle) {
        return row.vehicle.name
      }

      return ''
    },
    alertsSearchPeriods: function() {
      return [{
        value: 'last_one_hour',
        label: 'Última hora'
      }, {
        value: 'last_six_hours',
        label: 'Últimas 6 horas'
      }, {
        value: 'last_twelve_hours',
        label: 'Últimas 12 horas'
      }, {
        value: 'last_twentyfour_hours',
        label: 'Últimas 24 horas'
      }]
    }
  },
  methods: {
    load() {
      this.count += 10
    },
    cellStyle(row) {
      let result = 'padding: 0; '
      if (row.columnIndex === 0 && row.row.isNew) {
        result += 'background-color: Red'
      }
      return result
    },
    getAlertType(item) {
      if (item.notification.type === 'alarm') {
        return item.notification.attributes.alarms
      } else {
        return item.notification.type
      }
    },
    loadAlerts() {
      if (this.alerts.length === 0) {
        this.getAlerts()
      }
    },
    async getAlerts() {
      this.$log.debug('Refresh events list')
      this.loading = true
      const hours = this.getSearchHours()
      this.$log.debug(hours)
      await this.$store.dispatch('transient/fetchEvents', {
        start: Vue.moment().subtract(hours, 'hour').toDate(),
        end: new Date(),
        types: this.alerts
      })

      this.loading = false
    },
    getSearchHours() {
      switch (this.alertsSearchPeriod) {
        case 'last_six_hours':
          return 6
        case 'last_twelve_hours':
          return 12
        case 'last_twentyfour_hours':
          return 24
      }
      return 1
    },
    alertSelected: function(alert) {
      if (alert) {
        if (alert.isNew) {
          alert.isNew = false
          this.$store.dispatch('decUnreadItems')
        }
        serverBus.$emit(event.eventSelected, alert)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.mobileScroll {
  -webkit-overflow-scrolling: touch;
}

</style>
<style lang="scss">
@import '../../styles/element-variables.scss';

.listIcon {
  color: $--color-primary
}

.el-table .new-row {
  background: $--color-primary
}

.el-table .normal-row {
  background: $--color-success
}
</style>
