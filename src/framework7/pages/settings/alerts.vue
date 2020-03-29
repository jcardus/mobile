<template>
  <f7-page name="Vehicles">
    <f7-navbar back-link="" :title="$t('settings.alerts')"></f7-navbar>
    <f7-list media-list>
      <f7-list-item
        v-for="item in alerts"
        :key="item.id"
        :title="item.type"
        link="#"
        :subtitle="item.attributes"
        :after="item.always"
      >
      </f7-list-item>
    </f7-list>
  </f7-page>
</template>
<script>
import { mapGetters } from 'vuex'

export default {
  computed: {
    ...mapGetters(['alerts'])
  }
}

</script>
