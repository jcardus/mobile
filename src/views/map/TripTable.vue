<template>
  <div>
    <div class="mobileScroll">
      <el-table
        id="tripTable"
        :data="trips"
        row-key="id"
        :show-header="true"
        highlight-current-row
        stripe
        @row-click="tripSelected"
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
            <div style="padding: 3px 0 0;">
              <span style="font-weight: bold">{{ scope.lenght }} </span>
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
    trips: {
      get() { return this.$static.trips }
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
