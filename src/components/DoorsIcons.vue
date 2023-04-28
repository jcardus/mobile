<template>
  <div style="float: right">
    <span v-if="currentPosition && currentPosition.attributes && currentPosition.attributes.door1">
      <el-tooltip
        :content="(device.attributes.door1 || $t('vehicleDetail.door1')) + ': '+ $t('vehicleDetail.'+currentPosition.attributes.door1)"
      >
        <i :class="`fas fa-${currentPosition.attributes.door1 === 'closed'?'':'un'}lock`" :style="`color:${currentPosition.attributes.door1 === 'closed' ? '#ff0022':'#3D993D'}; padding-right:2px; padding-left:2px`"></i>
      </el-tooltip>
      <el-tooltip
        v-if="currentPosition && currentPosition.attributes && currentPosition.attributes.door2"
        :content="(device.attributes.door2 || $t('vehicleDetail.door2')) + ': '+ $t('vehicleDetail.'+currentPosition.attributes.door2)"
      >
        <i :class="`fas fa-${currentPosition.attributes.door2 === 'closed'?'':'un'}lock`" :style="`color:${currentPosition.attributes.door2 === 'closed' ? '#ff0022':'#3D993D'}; padding-right:2px; padding-left:2px`"></i>
      </el-tooltip>
    </span>
  </div>
</template>

<script>
export default {
  name: 'DoorsIcons',
  props: {
    device: {
      type: Object,
      default: () => {}
    },
    currentPosition: {
      type: Object,
      default: () => {}
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
