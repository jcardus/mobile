<template>
  <div class="dd-body">
    <div class="dd-body-inner">
      <label>
        <input v-model="filterKey" class="input" type="text" :placeholder="$t('vehicleList.search')">
      </label>
      <div>
        <table class="table">
          <thead>
            <tr>
              <th />
              <th
                v-for="key in headerColumns"
                :key="key"
                nowrap
                @click="sortBy(key)"
              >
                {{ key | formatHeaders | t | capitalize }}
                <span
                  v-if="key===sortKey"
                  class="fa"
                  :class="sortColumns[key] > 0 ? 'fa-arrow-up' : 'fa-arrow-down'"
                />
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
                <td><i class="fas fa-truck" :style="entry | formatColor" /></td>
                <td>
                  <div> <!-- v-for="key in columns" :key="key" :nowrap="key!=='lastUpdate'"-->
                    <span class="text-overflow">{{ entry.name | formatNumber }}</span>
                    <span class="text-overflow">{{ entry.speed | formatNumber }} km/h</span>
                    <span class="tag is-info">
                      <timeago
                        :datetime="entry.lastUpdate"
                        :auto-update="60"
                        :locale="$i18n.locale.substring(0,2)"
                      />
                    </span>
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
export default {
  name: 'VehicleTable',
  filters: {
    formatColor: function(value) {
      if (value.speed > 2) { return 'color:darkgreen' }
      if (value.ignition) { return 'color:gold' }
      return 'color:darkred'
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
      this.toggle()
      if (device) {
        this.selected = device.id
        serverBus.$emit('deviceSelected', device)
      }
    }
  }
}
</script>
<style lang="scss" scoped>
  @import "~bulma/sass/utilities/initial-variables";
  $primary: lightblue;
  @import '~bulma/bulma.sass';

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
        cursor: pointer;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
    }

    .table-body {
        display: block;
        transition: 1000ms ease-out;
        overflow: scroll;
        max-height: calc(100vh - 170px)
    }

    @media screen and (max-width: 768px) {
    }

    .input {
        height: 26px;
        width: calc(100% - 35px);
        font-size: inherit;
        margin: 8px;
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
</style>
