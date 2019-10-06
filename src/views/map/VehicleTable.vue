<template>
  <div v-show="show" class="dd-body">
    <div class="dd-body-inner">
      <label>
        <input v-model="filterKey" class="input" type="text" :placeholder="$t('vehicleList.search')">
      </label>
      <div>
        <table class="table">
          <thead>
            <tr>
              <th></th>
              <th
                v-for="key in headerColumns"
                :key="key"
                nowrap
                @click="sortBy(key)"
              >
                {{ key | formatHeaders | translate | capitalize }}
                <span
                  v-if="key===sortKey"
                  class="fa"
                  :class="sortColumns[key] > 0 ? 'fa-arrow-up' : 'fa-arrow-down'"
                >
                </span>
              </th>
            </tr>
          </thead>
        </table>
        <div class="table-body">
          <table id="mainTable" class="table is-striped">
            <tbody>
              <tr
                v-for="entry in filteredVehicles"
                :key="entry.id"
                :class="entry.id===selected?'is-selected':''"
                @click="vehicleSelected(entry)"
              >
                <td :style="entry | formatColor"></td>
                <td>
                  <div>
                    <span class="text-overflow">{{ entry.name | formatNumber }}</span>
                    <span class="text-overflow">{{ entry.speed | formatNumber }} km/h</span>
                    <span class="tag is-info" style="height: 1.5em;">
                      <timeago
                        :datetime="entry.lastUpdate"
                        :auto-update="60"
                        :locale="$i18n.locale.substring(0,2)"
                      ></timeago>
                    </span>
                    <el-tooltip :content="$t('vehicleTable.immobilize')" placement="bottom">
                      <i class="far fa-stop-circle command" @click="commandImmobilize(entry, true)"></i>
                    </el-tooltip>
                    <el-tooltip :content="$t('vehicleTable.de_immobilize')" placement="bottom">
                      <i class="far fa-play-circle command" @click="commandImmobilize(entry, false)"></i>
                    </el-tooltip>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
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
      columns: ['name', 'speed', 'lastUpdate', 'ignition'],
      headerColumns: ['name', 'speed'],
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
        background-color: #fff;
        border-top: 0;
        transition: 100ms ease-out;
        max-width: calc(100vw - 20px);
    }
    .dd-body-inner {
        padding: 5px;
    }
    th {
        font-size: 14px;
        cursor: pointer;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
    }
    .table td {
        padding: 3px 4px;
    }
    .table-body {
        font-size: 14px;
        display: block;
        transition: 1000ms ease-out;
        overflow-y: scroll;
        max-height: calc(100vh - 115px)
    }

    @media screen and (max-width: 768px) {
      .table-body {
        max-height: calc(100vh - 200px)
      }
    }

    .input {
        height: 26px;
        width: calc(100% - 5px);
        font-size: 14px;
        margin: 3px;
    }
    .table {
        width: 100%;
        padding: 0;
        margin: 0 !important;
    }

    .text-overflow {
        display: block;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }
    ::-webkit-scrollbar {
      width: 7px;
      height: 7px;
    }
    ::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 7px;
    }
    ::-webkit-scrollbar-thumb {
      background: #888;
      border-radius: 7px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: #555;
      border-radius: 7px;
    }
</style>
