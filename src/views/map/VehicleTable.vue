<template>
  <div v-show="show" class="dd-body">
    <div class="dd-body-inner">
      <el-input v-model="filterKey" class="input" type="text" :placeholder="$t('vehicleList.search')" />
      <el-table
        id="mainTable"
        highlight-current-row
        :data="filteredVehicles"
        stripe
        :cell-style="cellStyle"
        @current-change="vehicleSelected"
      >
        <el-table-column
          prop=""
          label=""
          width="10"
        >
        </el-table-column>
        <el-table-column
          prop="name"
          label="Name"
          sortable
        >
          <template slot-scope="scope">
            {{ scope.row.name }}<br />
            {{ scope.row.speed | formatNumber }} km/h<br />
            <timeago
              :datetime="scope.row.lastUpdate"
              :auto-update="60"
              :locale="$i18n.locale.substring(0,2)"
            ></timeago>
            <el-tooltip :content="$t('vehicleTable.immobilize')" placement="bottom">
              <i class="far fa-stop-circle command" @click="commandImmobilize(entry, true)"></i>
            </el-tooltip>
            <el-tooltip :content="$t('vehicleTable.de_immobilize')" placement="bottom">
              <i class="far fa-play-circle command" @click="commandImmobilize(entry, false)"></i>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>
<script>

import { serverBus, vm } from '../../main'
import Vue from 'vue'
import { traccar } from '../../api/traccar-api'
import VueCookies from 'vue-cookies'
const cookie = VueCookies.get('user-info')

export default {
  name: 'VehicleTable',
  filters: {
    translate(value) {
      return vm.$t(value)
    },
    formatColor: function(value) {
      if (value.speed > 2) { return 'background-color:#55ff55' }
      if (value.ignition) { return 'background-color:#ffff55' }
      return 'background-color:#ff5555'
    },
    formatNumber: function(value) {
      if (isNaN(value)) { return value }
      return Math.round(value)
    },
    capitalize: function(value) {
      if (!value) return ''
      value = value.toString()
      return value.charAt(0).toUpperCase() + value.slice(1)
    },
    formatHeaders: function(value) {
      if (value) { return 'vehicleList.column_' + value }
      return value
    }
  },
  data() {
    return {
      show: true,
      animating: false,
      data: [],
      selected: -1,
      devicesBackup: this.devices,
      propagate: true,
      lastUpdate: new Date(),
      sortColumns: {},
      filterKey: '',
      sortKey: ''
    }
  },
  computed: {
    devices: { get: function() { return vm.$data.devices }, set: function(value) { vm.$data.devices = value } },
    positions() {
      return vm.$data.positions
    },
    map() {
      return vm.$data.map
    },
    filteredVehicles: function() {
      const sortKey = this.sortKey
      const filterKey = this.filterKey && this.filterKey.toLowerCase()
      const order = this.sortColumns[sortKey] || 1
      let devices = this.devices
      if (filterKey) {
        devices = devices.filter(function(row) {
          return Object.keys(row).some(function(key) {
            return String(row[key]).toLowerCase().indexOf(filterKey) > -1
          })
        })
      }
      if (sortKey) {
        devices = devices.slice().sort(function(a, b) {
          a = a[sortKey]
          b = b[sortKey]
          return (a === b ? 0 : a > b ? 1 : -1) * order
        })
      }
      return devices
    }
  },
  mounted() {
    const self = this
    serverBus.$on('deviceSelectedOnMap', (device) => {
      self.selected = device.id
    })

    this.columns.forEach(function(key) {
      self.sortColumns[key] = 1
    })
  },
  methods: {
    cellStyle(row) {
      if (row.columnIndex === 0) {
        if (row.row.speed > 2) {
          return 'background-color:#55ff55'
        }
        if (row.row.ignition) {
          return 'background-color:#ffff55'
        }
        return 'background-color:#ff5555'
      }
      return ''
    },
    formatNumber: function(row, column, value) {
      if (isNaN(value)) { return value }
      return Math.round(value)
    },
    toggle: function() {
      this.show = !this.show
    },
    findFeatureByDeviceId(deviceId) {
      return this.positionsSource.features.find(function(e) {
        return e.properties.deviceId === deviceId
      })
    },
    sortBy: function(key) {
      this.sortKey = key
      this.sortColumns[key] = this.sortColumns[key] * -1
    },
    vehicleSelected: function(device) {
      if (device) {
        this.selected = device.id
        Vue.$log.debug('device=', device)
        serverBus.$emit('deviceSelected', device)
      }
    },
    commandImmobilize: function(device, value) {
      Vue.$log.debug('Immobilization ' + value + ' for device ' + device.id)
      var message
      if (value) {
        message = 'Send immobilization command?'
      } else {
        message = 'Send de-immobilization command?'
      }
      if (confirm(message)) {
        traccar.api_helper(
          {
            'username': cookie.email,
            'password': cookie.password,
            'command': 'immobilization',
            'deviceid': device.id,
            'value': value
          },
          this.commandImmobilizeOk,
          this.commandImmobilizeNok)
      }
    },
    commandImmobilizeOk: function(response) {
      Vue.$log.debug('Immobilization result' + response.data)
      if (response.data.success) {
        alert('OK: ' + response.data.details)
      } else {
        alert('NOK: ' + response.data.details)
      }
    },
    commandImmobilizeNok: function(reason) {
      Vue.$log.debug('Immobilization error: ' + reason)
      alert('Error: ' + reason)
    }
  }
}
</script>
<style lang="scss" scoped>
    .dd-body {
        transition: 100ms ease-out;
        max-width: calc(100vw - 20px);
    }
    .dd-body-inner {
        padding: 5px;
    }
</style>
