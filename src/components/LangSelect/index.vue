<template>
  <el-dropdown trigger="click" class="international" @command="handleSetLanguage">
    <div>
      <svg-icon icon-class="international" />
    </div>
    <el-dropdown-menu slot="dropdown">
      <el-dropdown-item :disabled="language==='en'" command="en">
        <svg-icon icon-class="gb" /> English
      </el-dropdown-item>
      <el-dropdown-item :disabled="language==='es'" command="es">
        <svg-icon icon-class="es" /> Español
      </el-dropdown-item>
      <el-dropdown-item :disabled="language==='pt'" command="pt">
        <svg-icon icon-class="pt" /> Português
      </el-dropdown-item>
    </el-dropdown-menu>
  </el-dropdown>
</template>

<script>

import VueCookies from 'vue-cookies'
import { loadLanguageAsync } from '../../main.js'

export default {
  computed: {
    language() {
      return this.$store.getters.language
    }
  },
  methods: {
    handleSetLanguage(lang) {
      loadLanguageAsync(lang)
      VueCookies.set('language', lang)
    }
  }
}
</script>
