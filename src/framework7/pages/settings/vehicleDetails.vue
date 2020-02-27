<template>
  <f7-page name="VehicleDetails">
    <f7-navbar back-link title="Configurações > Vehicles"></f7-navbar>
    <f7-block-title style="font-size: 20px">Edit Vehicle</f7-block-title>
    <f7-list no-hairlines-md>
      <f7-list-input
        label="Name"
        type="text"
        :value="name"
        placeholder="Your name"
        clear-button
      >
      </f7-list-input>
    </f7-list>
  </f7-page>
</template>

<script>
export default {
  name: 'VehicleDetails',
  data: function() {
    return {
      name: 'teste'
    }
  }
}
</script>
