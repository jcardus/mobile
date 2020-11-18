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
            <div
              style="display: flow-root; margin-top: 5px; border-radius:10px; padding-left: 10px; padding-bottom: 5px;padding-right: 10px"
              :class="currentTrip===scope.row ? 'tripSelectedBackground' : ''"
            >
              <div :class="getTripIndexClass(scope.row)" style="background-color: #FFFFFF ; border-radius:10px">
                <span style="font-size: 12px">{{ scope.$index + 1 }}ª Viagem</span>
              </div>
              <el-row>
                <el-col :span="24" class="colTripData">
                  <div>
                    <span style="font-size: 12px">{{ formatDate(scope.row.trip_start_fixtime) }}</span>
                  </div>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="12" class="colTripData">
                  <div>
                    <span style="font-size: 12px" :class="currentTrip===scope.row ? 'tripSelected' : ''">
                      <i class="fas fa-circle" style="width: 15px; color: #13ce66"></i> {{ formatTime(scope.row.trip_start_fixtime) }}</span>
                  </div>
                </el-col>
                <el-col :span="12" class="colTripData">
                  <div>
                    <span style="font-size: 12px" :class="currentTrip===scope.row ? 'tripSelected' : ''">
                      <i class="fas fa-circle" style="width: 15px; color: #F5365C"></i> {{ formatTime(scope.row.trip_end_fixtime) }} </span>
                  </div>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="24" class="colTripData">
                  <div v-if="hasEndPOI(scope.row)">
                    <span style="font-size: 12px"><i class="fas fa-map-marker-alt" style="width: 13px;padding-left: 2px;color: #055AE5"></i> {{ getPOIName(scope.row.endPoi) }}</span>
                  </div>
                  <div v-else>
                    <span style="font-size: 12px"><i class="fas fa-home" style="width: 15px; color: #055AE5"></i> {{ scope.row.trip_end_address }}</span>
                  </div>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="8" class="colTripData">
                  <div>
                    <span style="font-size: 12px;padding-right: 15px"><i class="fas fa-car" style="width: 15px; color: #13ce66"></i> {{ calculateTime(scope.row.trip_driving_time) }}</span>
                  </div>
                </el-col>
                <el-col :span="8" class="colTripData">
                  <div>
                    <span style="font-size: 12px;padding-right: 15px"><i class="fas fa-car" style="width: 15px; color: #FFBA00"></i> {{ calculateTime(scope.row.trip_idle_time) }}</span>
                  </div>
                </el-col>
                <el-col :span="8" class="colTripData">
                  <div>
                    <span style="font-size: 12px; "><i class="fas fa-car" style="width: 15px; color: #F5365C"></i> {{ calculateTime(scope.row.trip_stop_time) }}</span>
                  </div>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="12" class="colTripData">
                  <div>
                    <span style="font-size: 12px"><i class="fas fa-road" style="width: 15px; color: black"></i> {{ scope.row.trip_distance }} km</span>
                  </div>
                </el-col>
                <el-col :span="12" class="colTripData">
                  <div>
                    <span style="font-size: 12px"><i class="fas fa-tachometer-alt" style="color: #13ce66"></i> {{ scope.row.trip_avg_speed }} km/h </span>
                  </div>
                </el-col>
              </el-row>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div v-if="this.trips.length > 0" class="historyTotal">
      <div style="margin-top: 5px">
        <span style="font-size: 12px">Totais</span>
      </div>
      <div>
        <span style="font-size: 12px"><i class="fas fa-route"></i> {{ this.trips.length }} viagens</span>
      </div>
      <div style="width: 100%">
        <div style="width: 33%; float:left"><span style="font-size: 12px"><i class="fas fa-car" style="width: 15px; color: #13ce66"></i> {{ calculateTime(totalDrivingTime) }}</span></div>
        <div style="width: 33%; float:left"><span style="font-size: 12px"><i class="fas fa-car" style="width: 15px; color: #FFBA00"></i> {{ calculateTime(totalIdleTime) }}</span></div>
        <div style="width: 33%; float:left"><span style="font-size: 12px"><i class="fas fa-car" style="width: 15px; color: #F5365C"></i> {{ calculateTime(totalStopTime) }}</span></div>
      </div>
      <div>
        <span style="font-size: 12px"><i class="fas fa-road" style="width: 15px; color: black"></i> {{ totalKms }} km</span>
      </div>
    </div>
  </div>
</template>

<script>
import { serverBus, vm } from '../../main'
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
    ...mapGetters(['geofences', 'trips']),
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
      return Math.round(this.trips.reduce((sum, t) => sum + t.trip_distance, 0))
    },
    totalDrivingTime() {
      return this.trips.reduce((sum, t) => sum + t.trip_driving_time, 0)
    },
    totalIdleTime() {
      return this.trips.reduce((sum, t) => sum + t.trip_idle_time, 0)
    },
    totalStopTime() {
      return this.trips.reduce((sum, t) => sum + t.trip_stop_time, 0)
    }
  },
  methods: {
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
      return utils.calculateTimeHHMM(time)
    },
    getPOIName(poiId) {
      return this.pois.find(p => p.id === poiId).name
    }
  }
}
</script>

<style lang="scss">
  @import '../../styles/element-variables.scss';
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
  .el-row {
    line-height: normal;
    padding-bottom: 1px;
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
    padding-left: 5px;
  }
  .colTripData{
    margin-bottom: 0;
    justify-content: start;
  }
</style>
