<template>
  <f7-page name="MapSettings">
    <f7-navbar back-link style="align-items: start"><i class="fas fa-map" style="padding-right: 10px"></i> {{ $t('settings.map') }}</f7-navbar>
    <f7-block-title style="font-size: 15px">{{ $t('settings.vehicles') }}</f7-block-title>
    <f7-list no-hairlines-md>
      <f7-list-item>
        {{ $t('settings.showLabels') }}<f7-toggle :checked="showLabels" @change="saveShowLabels($event.target.checked)"></f7-toggle>
      </f7-list-item>
      <f7-list-item>
        {{ $t('settings.showFullDate') }}<f7-toggle :checked="showFullDate" @change="saveShowFullDate($event.target.checked)"></f7-toggle>
      </f7-list-item>
    </f7-list>
    <f7-block-title style="font-size: 15px">{{ $t('settings.route_history') }}</f7-block-title>
    <f7-list no-hairlines-md>
      <f7-list-item>
        {{ $t('settings.view_speed_alerts') }}<f7-toggle :checked="speedAlerts" @change="saveSpeedAlerts($event.target.checked)"></f7-toggle>
      </f7-list-item>
      <!-- Additional "radio" prop to enable radio list item -->
      <f7-list-item style="padding-left: 50px" :disabled="!speedAlerts">
        {{ $t('settings.use_route_speed_limit') }}<f7-radio value="road" name="useRoadLimit" :checked="useRoadLimit === 'road'" @change="changeMaxSpeedType($event.target.value)"></f7-radio>
      </f7-list-item>
      <f7-list-item style="padding-left: 50px" :disabled="!speedAlerts">
        {{ $t('settings.use_vehicle_speed_limit') }}<f7-radio value="vehicle" :disabled="!speedAlerts" name="useRoadLimit" :checked="useRoadLimit === 'vehicle'" @change="changeMaxSpeedType($event.target.value)"></f7-radio>
      </f7-list-item>
    </f7-list>
  </f7-page>
</template>
<script>
export default {
  name: 'MapSettings',
  data() {
    return {
      showLabels: this.$store.state.settings.showLabels,
      showFullDate: this.$store.state.settings.showFullDate,
      matchRoutes: this.$store.state.settings.matchRoutes,
      icons3d: this.$store.getters.vehicles3dEnabled,
      speedAlerts: this.$store.state.settings.viewSpeedAlerts,
      useRoadLimit: this.$store.state.settings.maxSpeedType,
      speedThreshold: this.$store.state.settings.speedThreshold
    }
  },
  computed: {
    shoFullDate() {
      return this.$store.state.settings.showFullDate
    }
  },
  methods: {
    saveSpeedAlerts(value) {
      this.speedAlerts = value
      this.changeSettings('viewSpeedAlerts', value)
    },
    saveShowLabels(value) {
      this.showLabels = value
      this.$store.commit('settings/SET_SHOW_LABELS', value)
    },
    saveShowFullDate(value) {
      this.$store.commit('settings/CHANGE_SETTING', { key: 'showFullDate', value })
    },
    saveMatchRoutes(value) {
      this.matchRoutes = value
      this.changeSettings('matchRoutes', value)
    },
    changeMaxSpeedType(value) {
      this.useRoadLimit = value
      this.changeSettings('maxSpeedType', value)
    },
    changeSpeedThreshold(value) {
      this.speedThreshold = value
      this.changeSettings('speedThreshold', value)
    },
    changeSettings(key, value) {
      this.$store.dispatch('settings/changeSetting', {
        key: key,
        value: value
      })
    }
  }
}
</script>
