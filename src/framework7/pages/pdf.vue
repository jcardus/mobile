<template>
  <iframe style="padding: 0; border:0; width:100vw; height: 100vh" :src="src" />
</template>

<script>
export default {
  name: 'Pdf',
  computed: {
    src() { return localStorage.getItem('pdf') }
  }
}
</script>
