<template>
  <i class="svg-icon fa-fw" :class="iconClass" aria-hidden="true" v-on="$listeners">
  </i>
</template>

<script>

export default {
  name: 'SvgIcon',
  props: {
    iconClass: {
      type: String,
      required: true
    },
    className: {
      type: String,
      default: ''
    }
  },
  computed: {
    iconName() {
      return `#icon-${this.iconClass}`
    },
    svgClass() {
      if (this.className) {
        return 'svg-icon ' + this.className
      } else {
        return 'svg-icon'
      }
    }
  }
}
</script>

<style scoped>
.svg-icon {
  margin-left: 16px !important;
  margin-right: 16px !important;
  fill: currentColor;
  //overflow: hidden;
}

</style>
