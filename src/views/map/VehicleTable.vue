<template>
  <div v-show="show" class="dd-body">
    <div class="dd-body-inner">
      <el-input v-if="!isMobile" v-model="filterKey" class="input" type="text" :placeholder="$t('vehicleList.search')" />
      <el-table
        v-if="isMobile"
        id="vehicleTable"
        highlight-current-row
        :data="filteredVehicles"
        stripe
        :cell-style="cellStyle"
        height="calc(100vh - 100px)"
        :show-header="false"
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
        >
          <template slot-scope="scope">
            <span style="font-weight: bold;">{{ scope.row.name }}</span><br />
            {{ scope.row.speed | formatNumber }} km/h<br />
            <timeago
              :datetime="scope.row.lastUpdate"
              :auto-update="60"
              :locale="$i18n.locale.substring(0,2)"
            ></timeago>
            <div v-if="scope.row.attributes.has_immobilization" id="traffic-signal" style="float: right;">
              <span v-if="scope.row.immobilization_active">
                <span id="red-light-on" class="traffic-light"></span>
                <el-tooltip :content="$t('vehicleTable.de_immobilize')" placement="bottom">
                  <span id="green-light-off" class="traffic-light" @click="commandImmobilize(scope.row.id, false)"></span>
                </el-tooltip>
              </span>
              <span v-else>
                <el-tooltip :content="$t('vehicleTable.immobilize')" placement="bottom">
                  <span id="red-light-off" class="traffic-light" @click="commandImmobilize(scope.row.id, true)"></span>
                </el-tooltip>
                <span id="green-light-on" class="traffic-light"></span>
              </span>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <el-tabs
        v-else
        active-tab-color="#9b59b6"
        active-text-color="white"
      >
        <el-tab-pane>
          <span slot="label">
            <div class="label-tab">
              <i class="fas fa-car-side"></i>
            </div>
          </span>
          <el-table
            v-show="!isMobile"
            id="vehicleTable"
            highlight-current-row
            :data="filteredVehicles"
            stripe
            :cell-style="cellStyle"
            :show-header="false"
            height="calc(100vh - 150px)"
            @current-change="vehicleSelected"
          >
            <el-table-column
              prop=""
              label=""
              width="10"
              heigth="10"
            >
            </el-table-column>
            <el-table-column
              prop="name"
              label="Vehicles"
              sortable=""
              heigth="1"
            >
              <template slot-scope="scope">
                <span style="font-weight: bold;">{{ scope.row.name }}</span><br />
                {{ scope.row.speed | formatNumber }} km/h<br />
                <timeago
                  :datetime="scope.row.lastUpdate"
                  :auto-update="60"
                  :locale="$i18n.locale.substring(0,2)"
                ></timeago>
                <div v-if="scope.row.attributes.has_immobilization" id="traffic-signal" style="float: right;">
                  <span v-if="scope.row.immobilization_active">
                    <span id="red-light-on" class="traffic-light"></span>
                    <el-tooltip :content="$t('vehicleTable.de_immobilize')" placement="bottom">
                      <span id="green-light-off" class="traffic-light" @click="commandImmobilize(scope.row.id, false)"></span>
                    </el-tooltip>
                  </span>
                  <span v-else>
                    <el-tooltip :content="$t('vehicleTable.immobilize')" placement="bottom">
                      <span id="red-light-off" class="traffic-light" @click="commandImmobilize(scope.row.id, true)"></span>
                    </el-tooltip>
                    <span id="green-light-on" class="traffic-light"></span>
                  </span>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane>
          <span slot="label">
            <div class="label-tab">
              <i class="fas fa-map-marker-alt"></i>
            </div>
          </span>
          <el-table
            id="poiTable"
            highlight-current-row
            :data="pois"
            :show-header="false"
            height="calc(100vh - 150px)"
            @current-change="poiSelected"
          >
            <el-table-column
              prop="name"
            >
            </el-table-column>
            <el-table-column label="" width="130">
              <template slot-scope="scope">

                <el-button
                  size="small"
                  @click="handleEdit(scope.row)"
                ><i class="fas fa-edit"></i></el-button>
                <el-button
                  size="small"
                  type="danger"
                  @click="handleDelete(scope.row)"
                ><i class="fas fa-trash-alt"></i></el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane>
          <span slot="label">
            <div class="label-tab">
              <i class="fas fa-draw-polygon"></i>
            </div>
          </span>
          <el-table
            id="geofenceTable"
            highlight-current-row
            :data="geofences"
            :show-header="false"
            height="calc(100vh - 150px)"
            @current-change="geofenceSelected"
          >
            <el-table-column
              prop="name"
            >
            </el-table-column>
            <el-table-column label="" width="130">
              <template slot-scope="scope">

                <el-button
                  size="small"
                  @click="handleEdit(scope.row)"
                ><i class="fas fa-edit"></i></el-button>
                <el-button
                  size="small"
                  type="danger"
                  @click="handleDelete(scope.row)"
                ><i class="fas fa-trash-alt"></i></el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>
<script>

import { serverBus, vm } from '../../main'
import * as lnglat from '@/utils/lnglat'
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
      sortKey: '',
      geofences: null,
      pois: null
    }
  },
  computed: {
    isMobile() {
      return lnglat.isMobile()
    },
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
  },
  created() {
    this.loadGeofences()
  },
  methods: {
    getBgColor: function(device) {
      if (!device.lastUpdate || this.$moment().diff(this.$moment(device.lastUpdate), 'days') > 5) { return 'Gray' }
      if (device.speed > 2) { return '#63EA4F' }
      if (device.ignition) { return '#FFA241' }
      return '#FF584C'
    },
    cellStyle(row) {
      let result = 'padding: 0; '
      if (row.columnIndex === 0) {
        result += 'background-color: ' + this.getBgColor(row.row)
      }
      return result
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
    poiSelected: function(poi) {
      if (poi) {
        Vue.$log.debug('poi=', poi)
        serverBus.$emit('areaSelected', poi.area)
      }
    },
    geofenceSelected: function(geofence) {
      if (geofence) {
        Vue.$log.debug('geofenceSelected=', geofence)
        serverBus.$emit('areaSelected', geofence.area)
      }
    },
    commandImmobilize: function(device, value) {
      Vue.$log.debug('Immobilization ' + value + ' for device ' + device)
      var message
      if (value) {
        message = 'Send immobilization command?'
      } else {
        message = 'Send de-immobilization command?'
      }
      const self = this
      this.$confirm(message).then(() => {
        traccar.api_helper(
          {
            'username': cookie.email,
            'password': cookie.password,
            'command': 'immobilization',
            'deviceid': device,
            'value': value
          },
          self.commandImmobilizeOk,
          self.commandImmobilizeNok)
      })
    },
    commandImmobilizeOk: function(response) {
      Vue.$log.debug('Immobilization result' + response.data)
      if (response.data.success) {
        this.$message('OK: ' + response.data.details)
      } else {
        this.$message('NOK: ' + response.data.details)
      }
    },
    commandImmobilizeNok: function(reason) {
      Vue.$log.debug('Immobilization error: ' + reason)
      this.$alert('Error: ' + reason)
    },
    loadGeofences() {
      traccar.geofences()
        .then(response => {
          this.geofences = response.data.filter(g => g.area.startsWith('POLYGON'))
          this.pois = response.data.filter(g => g.area.startsWith('CIRCLE'))
        })
    },
    handleEdit(row) {
      const type = this.getType(row)
      this.$prompt(this.$t('geofence.' + type + '_edit_name'), this.$t('geofence.' + type + '_edit_title'), {
        confirmButtonText: this.$t('geofence.geofence_edit_confirm'),
        cancelButtonText: this.$t('geofence.geofence_edit_cancel'),
        inputValue: row.name
      }).then(({ value }) => {
        var geofence = row
        geofence.name = value
        traccar.editGeofence(row.id, geofence, this.geofenceEdited(this.getType(row)))
        row.name = value
      }).catch(() => {
        this.$message({
          type: 'info',
          message: this.$t('geofence.' + type + '_edit_canceled')
        })
      })
    },
    handleDelete(row) {
      const type = this.getType(row)
      this.$confirm(this.$t('geofence.' + type + '_delete_info') + row.name, this.$t('geofence.' + type + '_delete_title'), {
        confirmButtonText: this.$t('geofence.geofence_edit_confirm'),
        cancelButtonText: this.$t('geofence.geofence_edit_cancel')
      }).then(() => {
        traccar.deleteGeofence(row.id, this.geofenceDeleted(this.getType(row)))
      }).catch(() => {
      })
    },
    geofenceEdited: function(type) {
      this.$message({
        type: 'success',
        message: this.$t('geofence.' + type + '_edited')
      })
    },
    geofenceDeleted(type) {
      this.loadGeofences()
      this.$message({
        message: this.$t('geofence.' + type + '_deleted'),
        type: 'success',
        duration: 5 * 1000
      })
    },
    getType(row) {
      if (row.area.startsWith('POLYGON')) { return 'geofence' } else { return 'poi' }
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
  .label-tab {
    width: 50px;
    height: 50px;
    text-align: center;
    font-size: 20px;
  }
  .hidden_header {
    display: none;
  }
  /* Traffic light */
  #traffic-signal {
      background-color: #000000;
      width: 30px;
      height: 14px;
      border-radius: 20px;
      cursor: pointer;
  }
  .traffic-light {
      position: relative;
      left: 2px;
      top: -4px;
      height: 10px;
      width: 10px;
      border-radius: 100%;
      display: inline-block;
  }
  #red-light-off {
      background-color: #660000;
  }
  #red-light-off:hover {
      background-color: #FF0000;
  }
  #green-light-off {
      background-color: #005500;
  }
  #green-light-off:hover {
      background-color: #00FF00;
  }
  #red-light-on {
      background-color: #FF0000;
      cursor: auto;
  }
  #green-light-on {
      background-color: #00FF00;
      cursor: auto;
  }
</style>

<style>
  /* Custom scrollbar */
  ::-webkit-scrollbar {
    width: 7px;
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
