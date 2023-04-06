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
        <div v-if="loadingRoutes" slot="empty">
          <i class="el-icon-loading"></i>
        </div>
        <el-table-column
          prop="deviceTime"
          label="Vehicles"
          sortable=""
          heigth="1"
        >
          <template v-slot="scope">
            <div
              style="display: flow-root; border-radius:10px; padding: 5px"
              :class="currentTrip===scope.row ? 'tripSelectedBackground' : ''"
            >
              <div :class="getTripIndexClass(scope.row)">
                <span>{{ scope.$index + 1 }}ª {{ $t('tripsTable.trip') }}</span>
              </div>
              <el-row>
                <el-col :span="8" class="colTripData">
                  <div>
                    <span style="font-size: 12px" :class="currentTrip===scope.row ? 'tripSelected' : ''">
                      {{ scope.row.trip_start_fixtime.toLocaleDateString && scope.row.trip_start_fixtime.toLocaleDateString() }}
                    </span>
                  </div>
                </el-col>
                <el-col :span="8" class="colTripData">
                  <div>
                    <span style="font-size: 12px" :class="currentTrip===scope.row ? 'tripSelected' : ''">
                      <i class="fas fa-flag" style="width: 15px; color: #13ce66"></i> {{ formatTime(scope.row.trip_start_fixtime) }}</span>
                  </div>
                </el-col>
                <el-col :span="8" class="colTripData">
                  <div>
                    <span v-if="scope.row.trip_end_fixtime" style="font-size: 12px" :class="currentTrip===scope.row ? 'tripSelected' : ''">
                      <i class="fas fa-flag-checkered" style="width: 15px; color: #F5365C"></i>
                      {{ scope.row.trip_end_fixtime && scope.row.trip_end_fixtime.toLocaleTimeString() }}
                    </span>
                  </div>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="24" class="colTripData">
                  <div v-if="hasEndPOI(scope.row)">
                    <span style="font-size: 12px">
                      <i class="fas fa-map-marker-alt" style="width: 13px;padding-left: 2px;color: #055AE5"></i>
                      {{ getPOIName(scope.row.endPoi) }}
                    </span>
                  </div>
                  <div v-else style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    <span style="font-size: 12px">
                      <i class="fas fa-home" style="width: 15px; color: #055AE5"></i>
                      {{ scope.row.trip_end_address }}
                    </span>
                  </div>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="8" class="colTripData">
                  <div>
                    <span style="font-size: 12px;padding-right: 15px"><i class="fas fa-timer" style="width: 15px; color: #13ce66"></i> {{ calculateTime(scope.row.trip_driving_time) }}</span>
                  </div>
                </el-col>
                <el-col :span="8" class="colTripData">
                  <div>
                    <span style="font-size: 12px;padding-right: 15px"><i class="fas fa-timer" style="width: 15px; color: #FFBA00"></i> {{ calculateTime(scope.row.trip_idle_time) }}</span>
                  </div>
                </el-col>
                <el-col :span="8" class="colTripData">
                  <div>
                    <span style="font-size: 12px; "><i class="fas fa-timer" style="width: 15px; color: #F5365C"></i> {{ calculateTime(scope.row.trip_stop_time) }}</span>
                  </div>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="8" class="colTripData">
                  <div>
                    <span style="font-size: 12px"><i class="fas fa-road" style="width: 15px; color: black"></i> {{ Math.round(scope.row.trip_distance/1000) }} km</span>
                  </div>
                </el-col>
                <el-col :span="8" class="colTripData">
                  <div>
                    <span style="font-size: 12px"><i class="fas fa-tachometer-alt" style="color: #13ce66"></i> {{ scope.row.trip_avg_speed }} km/h </span>
                  </div>
                </el-col>
                <el-col :span="8" class="colTripData">
                  <div>
                    <span style="font-size: 12px">
                      <i class="fas fa-bell" style="width: 15px; color: black"></i>{{ tripEvents(scope.row) }}
                    </span>
                  </div>
                </el-col>
              </el-row>
              <el-row v-if="scope.row.fuelInfo">
                <el-col :span="12" class="colTripData">
                  <div>
                    <span style="font-size: 12px"><i class="fas fa-gas-pump" style="color: #13ce66"></i> {{ scope.row.fuel_consumption }}L</span><span style="font-size: 10px"> ({{ scope.row.avg_fuel_consumption }}L\100)</span>
                  </div>
                </el-col>
              </el-row>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div v-if="trips.length > 0" :style="historyTotalHeight" class="historyTotal">
      <div style="margin-top: 5px">
        <span style="font-size: 12px">{{ $t('tripsTable.total') }}</span>
      </div>
      <div>
        <span style="font-size: 12px"><i class="fas fa-route"></i> {{ trips.length + ' ' + $t('tripsTable.trips') }} </span>
      </div>
      <div style="width: 100%">
        <div style="width: 33%; float:left"><span style="font-size: 12px"><i class="fas fa-car" style="width: 15px; color: #13ce66"></i> {{ calculateTime(totalDrivingTime) }}</span></div>
        <div style="width: 33%; float:left"><span style="font-size: 12px"><i class="fas fa-car" style="width: 15px; color: #FFBA00"></i> {{ calculateTime(totalIdleTime) }}</span></div>
        <div style="width: 33%; float:left"><span style="font-size: 12px"><i class="fas fa-car" style="width: 15px; color: #F5365C"></i> {{ calculateTime(totalStopTime) }}</span></div>
      </div>
      <div>
        <div style="width: 33%; float:left"><span style="font-size: 12px"><i class="fas fa-road" style="width: 15px; color: black"></i> {{ totalKms }} km</span></div>
        <div style="width: 33%; float:left"><span style="font-size: 12px"><i class="fas fa-tachometer-alt" style="width: 15px;color: #13ce66"></i> {{ totalAvgSpeed }}  km/h </span></div>
        <div style="width: 33%; float:left"><span style="font-size: 12px"><i class="fas fa-bell" style="width: 15px; color: black"></i> {{ totalEvents }}</span></div>
      </div>
      <div>
        <div v-if="trips[0].fuelInfo" style="float:left"><span style="font-size: 12px"><i class="fas fa-gas-pump" style="color: #13ce66"></i> {{ totalFuelConsumption }}L</span><span style="font-size: 10px"> ({{ avgFuelConsumption }}L\100)</span></div>
      </div>
    </div>
  </div>
</template>

<script>
import { serverBus, vm } from '@/main'
import { mapGetters } from 'vuex'
import * as event from '../../events'
import styles from '../../styles/element-variables.scss'
import * as utils from '../../utils/utils'

export default {
  name: 'TripTable',
  data() {
    return {
      currentTrip: null
    }
  },
  computed: {
    ...mapGetters(['geofences', 'trips', 'totalDistance']),
    loadingRoutes: {
      get() { return vm.$data.loadingRoutes },
      set(value) { vm.$data.loadingRoutes = value }
    },
    height() {
      return 'calc(100vh - ' + styles.tripListHeaderHeight + ')'
    },
    pois() {
      return this.geofences.filter(g => g && g.area.startsWith('CIRCLE'))
    },
    totalKms() {
      return Math.round(this.totalDistance / 1000)
    },
    totalAvgSpeed() {
      return (this.trips.map(t => t.trip_avg_speed * (t.trip_distance / 1000)).reduce((sum, value) => sum + value, 0) / this.totalKms).toFixed(1)
    },
    totalFuelConsumption() {
      return Math.round(this.trips.reduce((sum, t) => sum + (t.fuel_consumption < 0 ? 0 : t.fuel_consumption), 0))
    },
    avgFuelConsumption() {
      const totalKms = this.totalKms
      return Math.round(totalKms > 0 ? this.totalFuelConsumption * 100 / totalKms : 0)
    },
    totalDrivingTime() {
      return this.trips.reduce((sum, t) => sum + t.trip_driving_time, 0)
    },
    totalIdleTime() {
      return this.trips.reduce((sum, t) => sum + t.trip_idle_time, 0)
    },
    totalStopTime() {
      return this.trips.reduce((sum, t) => sum + (t.trip_stop_time || 0), 0)
    },
    totalEvents() {
      return this.trips.reduce((sum, t) => sum + this.tripEvents(t), 0)
    },
    historyTotalHeight() {
      return 'height:' + (this.trips[0].fuelInfo ? 95 : 75) + 'px;'
    }
  },
  methods: {
    tripEvents(trip) {
      return trip.positions.reduce((a, b) => a + (b.events ? b.events.length : 0), 0)
    },
    getTripIndexClass(row) {
      return this.currentTrip === row ? 'overlap tripSelected' : 'overlap'
    },
    hasEndPOI(row) {
      return row.endPoi != null
    },
    tripSelected: function(trip) {
      this.currentTrip = trip
      serverBus.$emit(event.tripChanged, this.trips.indexOf(trip))
    },
    formatDate(date) {
      return this.$moment(date, 'DD-MM-YYYY HH:mm:ss').format('YYYY-MM-DD')
    },
    formatTime(date) {
      return this.$moment(date, 'DD-MM-YYYY HH:mm:ss').format('HH:mm:ss')
    },
    calculateTime(time) {
      return time !== undefined ? utils.calculateTimeHHMM(time) : ''
    },
    getPOIName(poiId) {
      return this.pois.find(p => p.id === poiId).name
    }
  }
}
</script>

<style lang="scss" scoped>
@import '../../styles/element-variables.scss';
.mobileScroll {
  -webkit-overflow-scrolling: touch;
}
.overlap{
  font-size: 10px;
  background-color: #FFFFFF;
  border-radius: 5px;
  top: -10px;
  position: relative;
  left: 10px;
  width: 150px;
  height: 22px;
  vertical-align: top;
  padding-left: 10px
}
.el-row {
  line-height: normal;
}
.el-row::before {
  content: none;
}
.el-row::after {
  content: none;
}
.el-table td{
  padding: 5px;
}
.tripSelected {
  font-weight: bold;
}
.tripSelectedBackground {
  background-color: rgba($--color-primary, 0.1);
}
.historyTotal {
  height: 75px;
  background-color: rgba($--color-primary, 0.1);
  color: black;
  padding-left: 5px;
}
.colTripData{
  margin-bottom: 0;
  justify-content: start;
}
</style>
