<template>
  <div id="vehicleList" ref="vehicleList" class="vehicleList mapboxgl-ctrl">
    <div class="card">
      <div class="card-header" :open="false" :class="{opened:show}" @click="toggle">
        <p class="card-header-title">
          Vehicles
        </p>
        <a class="card-header-icon">
          <i class="fa fa-2x black fa-angle-down header-icon" :class="{rotate:show}" />
        </a>
      </div>
      <transition
        name="accordion"
        @before-enter="beforeEnter"
        @enter="enter"
        @before-leave="beforeLeave"
        @leave="leave"
      >
        <div v-show="show" class="dd-body">
          <div class="dd-body-inner">
            <input v-model="filterKey" class="input" type="text" placeholder="Search...">
            <div>
              <table class="table is-striped">
                <thead>
                  <tr>
                    <th />
                    <th
                      v-for="key in columns"
                      :key="key"
                      nowrap
                      @click="sortBy(key)"
                    >
                      {{ key | formatHeaders | capitalize }}
                      <span v-if="key===sortKey" class="fa" :class="sortColumns[key] > 0 ? 'fa-arrow-up' : 'fa-arrow-down'" />
                    </th>
                  </tr>
                </thead>
              </table>
              <div class="table-body" body-scroll-lock-ignore>
                <table class="table is-striped" body-scroll-lock-ignore>
                  <tbody body-scroll-lock-ignore>
                    <tr
                      v-for="entry in filteredVehicles"
                      :key="entry.id"
                      :class="entry.id===selected?'is-selected':''"
                      @click="vehicleSelected(entry)"
                    >
                      <td><i class="fas fa-truck" :style="entry | formatColor" /></td>
                      <td v-for="key in columns" :key="key" :nowrap="key!=='lastUpdate'">
                        <span :class="key==='lastUpdate'?'tag is-success':''">
                          <timeago v-if="key==='lastUpdate'" :datetime="entry[key]" :auto-update="60" />
                          <div v-else>{{ entry[key] | formatNumber }}</div>
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script>
import { serverBus, vm } from '../../main'

export default {
  filters: {
    formatColor: function(value) {
      if (value.speed > 1) { return 'color:darkgreen' }
      if (value.ignition) { return 'color:darkyellow' }
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
      if (value && value === 'lastUpdate') { return 'Last update' }
      if (value && value === 'speed') { return 'Km/h' }
      return value
    }
  },
  props: {
    open: {
      type: Boolean,
      default: true
    },
    animation: {
      type: String,
      default: 'fade'
    },
    ariaId: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      columns: ['name', 'speed', 'lastUpdate'],
      animating: false,
      data: [],
      selected: -1,
      devicesBackup: this.devices,
      propagate: true,
      lastUpdate: new Date(),
      show: false,
      sortKey: '',
      sortColumns: {},
      filterKey: ''
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
    vehicleSelected: function(device) {
      this.toggle()
      this.selected = device.id
      serverBus.$emit('deviceSelected', device)
    },

    sortBy: function(key) {
      this.sortKey = key
      this.sortColumns[key] = this.sortColumns[key] * -1
    },
    toggle: function() {
      this.show = !this.show
    },
    beforeEnter: function(el) {
      el.style.height = '0'
    },
    enter: function(el) {
      el.style.height = el.scrollHeight + 'px'
    },
    beforeLeave: function(el) {
      el.style.height = el.scrollHeight + 'px'
    },
    leave: function(el) {
      el.style.height = '0'
    }
  },
  findFeatureByDeviceId(deviceId) {
    return this.positionsSource.features.find(function(e) {
      return e.properties.deviceId === deviceId
    })
  }

}
</script>

<style lang="scss" scoped>
    @import "~bulma/sass/utilities/initial-variables";
    $primary: lightblue;

    @import '~bulma/bulma.sass';

    .vehicleList {
        position: absolute;
        top: 0;
        left: 0;
        width: 355px;
        font-size: 15px;
    }

    th.active {
        color: #fff;
    }

    .card {
        background-color: rgba(255,255,255,0.8);
    }

    .card-header-title {
        border: 0;
        margin-bottom: 0 !important;
    }
    .card-header {
        //  border: 1px solid lightblue;
    }

    .card-header.opened {
        border-bottom: 0;
    }

    .card-header .header-icon.rotate {
        transform: rotate(180deg);
        transition-duration: 0.3s;
        color: black;
    }

    .vehicle-table {
        position: relative;
        top: 0;
        left: 0;
    }

    .header-icon {
        position: absolute;
        top: 5px;
        right: 8px;
        transform: rotate(0deg);
        transition-duration: 0.3s;
        color:black;
    }

    .dd-body {

        background-color: #fff;

        border-top: 0;
        transition: 100ms ease-out;
        height:100%;
        max-width: calc(100vw - 20px);
    }

    .dd-body-inner {
        padding: 0;
    }

    table {
        margin: 0px !important;
    }

    tr {
        padding-bottom: 0 !important;
        padding-top: 0 !important;
    }

    td {
        padding-left: 7px !important;
        padding-right: 0 !important;

    }

    th {
        cursor: pointer;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
    }

    .table-body {
        overflow: auto;
        max-height: calc(75vh - 150px);
        transition: 1000ms ease-out;
    }

    @media screen and (max-width: 768px) {
        .vehicleList {
            z-index: 3;
            width: calc(100vw - 20px);
        }
    }

    .input {
        height: 26px;
        width: calc(100% - 35px);
        font-size: inherit;
        margin: 8px;
    }
</style>
