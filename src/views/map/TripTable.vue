<template>
  <div>
    <div class="mobileScroll">
      <el-table
        id="tripTable"
        :data="trips"
        row-key="id"
        :show-header="false"
        highlight-current-row
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
            <div style="padding: 3px 0 0;">
              <span style="font-weight: bold">Distance: {{ scope.row.totalDistance }} </span>
              <span style="font-weight: bold">Start: {{ scope.row.positions[scope.row.positions.length - 1].fixTime }} </span>
              <span style="font-weight: bold">End: {{ scope.row.positions[scope.row.positions.length - 1].fixTime }} </span>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script>
import { vm } from '../../main'

export default {
  name: 'TripTable',
  data() {
    return {}
  },
  computed: {
    trips: function() {
      vm.$data.trips = []
      return vm.$data.trips
    },
    loadingRoutes: {
      get() { return vm.$data.loadingRoutes },
      set(value) { vm.$data.loadingRoutes = value }
    }
  },
  methods: {
    tripSelected: function(trip) {

    }
  }
}
</script>

<style scoped>

</style>
