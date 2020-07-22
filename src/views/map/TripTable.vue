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
              style="display: flow-root; margin-top: 10px; border-radius:10px; padding-left: 10px; padding-bottom: 10px;padding-right: 10px"
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
                    <span style="font-size: 12px;padding-right: 15px"><i class="fas fa-car" style="width: 15px; color: #13ce66"></i> {{ scope.row.trip_driving_time }}</span>
                  </div>
                </el-col>
                <el-col :span="8" class="colTripData">
                  <div>
                    <span style="font-size: 12px;padding-right: 15px"><i class="fas fa-car" style="width: 15px; color: #FFBA00"></i> {{ scope.row.trip_idle_time }}</span>
                  </div>
                </el-col>
                <el-col :span="8" class="colTripData">
                  <div>
                    <span style="font-size: 12px; "><i class="fas fa-car" style="width: 15px; color: #F5365C"></i> {{ scope.row.trip_stop_time }}</span>
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
  </div>
</template>

<script>
import { serverBus, vm } from '../../main'
import { mapGetters } from 'vuex'
import * as event from '../../events'

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
      // return `calc(100vh - ${consts.vehicleListHeaderHeight}px)`
      // todo: use constants
      return 'calc(100vh - 385px)'
    },
    pois() {
      return this.geofences.filter(g => g && g.area.startsWith('CIRCLE'))
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
  .tripSelected {
    font-weight: bold;
  }
  .tripSelectedBackground {
    background-color: rgba($--color-primary, 0.1);
  }
  .colTripData{
    padding: 2px;
    margin-bottom: 0;
    justify-content: start;
  }
</style>
