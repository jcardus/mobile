<template>
  <span>
    <span
      v-if="currentPosition && currentPosition.attributes.battery && currentPosition.attributes.battery > 5"
      style="padding-right: 4px"
    >
      <el-tooltip :content="currentPosition.attributes.battery.toFixed(2) + 'V'">
        <i
          :class="'fas fa-battery-' + icon(currentPosition.attributes.battery)"
          :style="'color: ' + color(currentPosition.attributes.battery)"
        ></i>
      </el-tooltip>
    </span>
    <span v-if="currentPosition && currentPosition.attributes.temp1 && currentPosition.attributes.temp1 !== 175 && currentPosition.attributes.temp1 !== 3000">
      <i class="fas fa-thermometer-quarter rpmIcon" style="padding-left:2px"></i>  {{ currentPosition.attributes.temp1 }}ºC
    </span>
    <span v-if="currentPosition && currentPosition.attributes.temp2 && currentPosition.attributes.temp2 !== 175 && currentPosition.attributes.temp2 !== 3000">
      <i class="fas fa-thermometer-quarter rpmIcon" style="padding-left:2px"></i>  {{ currentPosition.attributes.temp2 }}ºC
    </span>
    <span v-if="currentPosition && currentPosition.attributes['coolantTemp']">
      <el-tooltip :content="currentPosition && currentPosition.attributes['coolantTemp'] + '°C'">
        <i class="fa-duotone fa-oil-temperature" style="color:#3D993D"></i>
      </el-tooltip> {{ currentPosition && currentPosition.attributes['coolantTemp'] + '°C' }}
    </span>
  </span>
</template>

<script>
export default {
  name: 'TemperatureIcons',
  props: {
    device: {
      type: Object,
      default: () => {}
    },
    currentPosition: {
      type: Object,
      default: () => {}
    }
  },
  methods: {
    color: battery => battery < 6.6 ? 'red' : (battery < 7 ? 'orange' : 'green'),
    icon: battery => battery < 6.6 ? 'slash' : (battery < 7 ? 'half' : 'full')
  }
}
</script>
