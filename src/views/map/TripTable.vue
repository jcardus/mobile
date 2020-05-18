<template>
  <div>
    <div class="mobileScroll">
      <el-table
        id="tripTable"
        :data="trips"
        row-key="id"
        :height="height"
        :show-header="false"
        stripe
        @row-click="tripSelected"
      >
        <el-table-column
          prop="deviceTime"
          label="Vehicles"
          sortable=""
          heigth="1"
        >
          <template slot-scope="scope">
            <div style="background-color: rgba(225, 225, 225, .6) ; margin-top: 12px; border-radius:10px; padding-left: 10px; padding-bottom: 10px;padding-right: 10px">
              <div class="overlap" style="background-color: #FFFFFF ; border-radius:10px">
                <span style="font-size: 12px">{{ scope.$index + 1 }}ª Viagem</span>
              </div>
              <div style="line-height: normal">
                <span style="font-size: 12px">{{ formatDate(scope.row.positions[0].fixTime) }}</span>
              </div>
              <div style="line-height: normal; padding-top: 5px">
                <span style="font-size: 12px; float: left;padding-right: 20px"><i class="far fa-flag" style="width: 15px; color: green"></i> {{ formatTime(scope.row.positions[0].fixTime) }}</span>
                <span style="font-size: 12px;"><i class="fas fa-flag-checkered" style="width: 15px; color: black"></i> {{ formatTime(scope.row.positions[scope.row.positions.length - 1].fixTime) }} </span>
              </div>
              <div v-if="hasEndPOI(scope.row)" style="line-height: normal; padding-top: 10px">
                <span style="font-size: 12px"><i class="fas fa-map-marker-alt" style="width: 13px;padding-left: 2px;color: #055AE5"></i> {{ getPOIName(scope.row.endPoi) }}</span>
              </div>
              <div v-else style="line-height: normal">
                <span style="font-size: 12px; word-break: normal;"><i class="fas fa-home" style="width: 15px; color: #055AE5"></i> {{ scope.row.positions[scope.row.positions.length - 1].address }}</span>
              </div>
              <div style="line-height: normal; padding-top: 10px">
                <span style="font-size: 12px; "><i class="fas fa-car" style="width: 15px; color: #F5365C"></i>5m</span>
                <span style="font-size: 12px;float: left;padding-right: 20px"><i class="fas fa-car" style="width: 15px; color: #055AE5"></i>{{ scope.row.totalTime }}</span>
                <span style="font-size: 12px;float: left;padding-right: 20px"><i class="fas fa-car" style="width: 15px; color: #13ce66"></i>2h25m</span>
                <span style="font-size: 12px;float: left;padding-right: 20px"><i class="fas fa-car" style="width: 15px; color: #FFBA00"></i>5m</span>
              </div>
              <div style="line-height: normal">
                <span style="font-size: 12px"><i class="fas fa-road" style="width: 15px; color: black"></i>{{ scope.row.totalDistance | formatNumber }} km</span>
              </div>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script>
import { serverBus, vm } from '../../main'
import styles from '../../styles/element-variables.scss'
import { mapGetters } from 'vuex'

export default {
  name: 'TripTable',
  filters: {
    formatNumber: function(value) {
      if (isNaN(value)) {
        return value
      }
      return Math.round(value)
    }
  },
  data() {
    return {}
  },
  computed: {
    ...mapGetters(['geofences']),
    trips: function() {
      vm.$data.trips = []
      return vm.$data.trips
    },
    tripsReport: function() {
      vm.$data.tripsReport = []
      return vm.$data.tripsReport
    },
    loadingRoutes: {
      get() { return vm.$data.loadingRoutes },
      set(value) { vm.$data.loadingRoutes = value }
    },
    height() {
      return 'calc(100vh - ' + styles.vehicleListHeaderHeight + ')'
    },
    pois: function() {
      return this.geofences.filter(g => g && g.area.startsWith('CIRCLE'))
    }
  },
  mounted() {
    vm.$data.tripsReport = []
  },
  methods: {
    hasEndPOI(row) {
      return row.endPoi != null
    },
    tripSelected: function(trip) {
      serverBus.$emit('tripChanged', this.trips.indexOf(trip))
    },
    formatDate(date) {
      return this.$moment(date).format('YYYY-MM-DD')
    },
    formatTime(date) {
      return this.$moment(date).format('HH:mm:ss')
    },
    getPOIName(poiId) {
      return this.pois.find(p => p.id === poiId).name
    }
  }
}
</script>

<style lang="scss" scoped>
  .mobileScroll {
    -webkit-overflow-scrolling: touch;
  }
  .overlap{
    top: -10px;
    position: relative;
    left: 10px;
    width: 150px;
    height: 22px;
    vertical-align: top;
    padding-left: 10px
  }
</style>
