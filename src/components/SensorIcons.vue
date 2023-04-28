<template>
  <div style="float: right; padding-right: 2px">
    <span v-if="showIcon">
      <el-tooltip :content="device.attributes[sensor] + ': ' + (currentPosition.attributes[device.attributes[sensor+'Attribute']] ? device.attributes[sensor+'on'] : device.attributes[sensor+'off'])">
        <i
          :class="`fas fa-${device.attributes[sensor+'icon'] ? device.attributes[sensor+'icon'] : 'lightbulb'} ${currentPosition.attributes[device.attributes[sensor+'Attribute']] ? 'sensorOn' : 'sensorOff'}`"
          :style="`${currentPosition.attributes[device.attributes[sensor+'Attribute']] ? (device.attributes[sensor+'OnColor'] ? 'color: '+device.attributes[sensor+'OnColor'] : '') : (device.attributes[sensor+'OffColor'] ? 'color: '+device.attributes[sensor+'OffColor'] : '') }`"
        ></i>
      </el-tooltip>
    </span>
  </div>
</template>

<script>
export default {
  name: 'SensorIcons',
  props: {
    sensor: {
      type: String,
      default: () => ''
    },
    device: {
      type: Object,
      default: () => {}
    },
    currentPosition: {
      type: Object,
      default: () => {}
    }
  },
  computed: {
    showIcon() {
      return this.currentPosition &&
        this.currentPosition.attributes &&
        this.device.attributes[this.sensor + 'Attribute'] &&
        Object.keys(this.currentPosition.attributes).includes(this.device.attributes[this.sensor + 'Attribute'])
    }
  }
}
</script>

<style lang="scss" scoped>
@import '../styles/element-variables.scss';
.sensorOff {
  padding-left: 1px;
  color: $--color-danger
}
.sensorOn {
  padding-left: 1px;
  color: $--color-success
}
</style>
