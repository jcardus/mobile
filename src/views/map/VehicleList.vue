<template>
  <div id="vehicleList" ref="vehicleList" class="vehicleList mapboxgl-ctrl">
    <div class="card">
      <div class="card-header" :open="false" :class="{opened:show}" @click="toggle">
        <p class="card-header-title">
          {{ $t('vehicleList.title') }}
        </p>
        <a class="card-header-icon">
          <i class="fa fa-2x black fa-angle-down header-icon" :class="{rotate:show}" />
        </a>
      </div>
      <transition>
        <vehicle-table />
      </transition>
    </div>
  </div>
</template>

<script>
import VehicleTable from './VehicleTable'

export default {
  components: { VehicleTable },
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
  computed: {

  },
  methods: {
    enter: function(el) {
      el.style.height = '100px'
    },
    leave: function(el) {
      el.style.height = '0'
    }
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
        min-width: 200px;
        max-width: 355px;
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

    th {
        cursor: pointer;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
    }

    @media screen and (max-width: 768px) {
        .vehicleList {
            z-index: 3;
            width: calc(100vw - 20px);
        }
    }

</style>
