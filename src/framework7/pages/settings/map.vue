<template>
  <f7-page name="MapSettings">
    <f7-navbar back-link :title="$t('route.settings')"></f7-navbar>
    <f7-block-title style="font-size: 20px"><i class="fas fa-map"></i> {{ $t('settings.map') }}</f7-block-title>
    <f7-block-title style="font-size: 15px">{{ $t('settings.route_history') }}</f7-block-title>
    <f7-list title="Histórico de Rota" no-hairlines-md>
      <f7-list-item>
        {{ $t('settings.route_match') }}<f7-toggle :checked="matchRoutes" @change="saveMatchRoutes($event.target.checked)"></f7-toggle>
      </f7-list-item>
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
      <f7-list-input
        style="padding-left: 50px"
        :disabled="!speedAlerts"
        :label="$t('settings.max_speed_threshold')"
        type="number"
        :value="speedThreshold"
        min="0"
        @input="changeSpeedThreshold($event.target.value)"
      ></f7-list-input>
    </f7-list>
  </f7-page>
</template>
<script>
export default {
  name: 'MapSettings',
  data: function() {
    return {
      matchRoutes: false,
      speedAlerts: false,
      useRoadLimit: 'road',
      speedThreshold: 120
    }
  },
  mounted() {
    this.matchRoutes = this.$store.state.settings.matchRoutes
    this.speedAlerts = this.$store.state.settings.viewSpeedAlerts
    this.useRoadLimit = this.$store.state.settings.maxSpeedType
    this.speedThreshold = this.$store.state.settings.speedThreshold
  },
  methods: {
    saveSpeedAlerts(value) {
      this.speedAlerts = value
      this.$store.dispatch('settings/changeSetting', {
        key: 'viewSpeedAlerts',
        value: value
      })
    },
    saveMatchRoutes(value) {
      this.matchRoutes = value
      this.$store.dispatch('settings/changeSetting', {
        key: 'matchRoutes',
        value: value
      })
    },
    changeMaxSpeedType(data) {
      this.useRoadLimit = data
      this.$store.dispatch('settings/changeSetting', {
        key: 'maxSpeedType',
        value: data
      })
    },
    changeSpeedThreshold(value) {
      this.speedThreshold = value
      this.$store.dispatch('settings/changeSetting', {
        key: 'speedThreshold',
        value: this.speedThreshold
      })
    }
  }
}
</script>
