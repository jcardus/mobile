<template>
  <el-dropdown trigger="click" class="international" @command="handleSetLanguage">
    <div>
      <svg-icon icon-class="international" />
    </div>
    <el-dropdown-menu slot="dropdown">
      <el-dropdown-item :disabled="language==='en'" command="enGB">
        <svg-icon icon-class="gb" /> English
      </el-dropdown-item>
      <el-dropdown-item :disabled="language==='fr'" command="frFR">
        <svg-icon icon-class="fr" /> Française
      </el-dropdown-item>
      <el-dropdown-item :disabled="language==='es'" command="esCL">
        <svg-icon icon-class="es" /> Español
      </el-dropdown-item>
      <el-dropdown-item :disabled="language==='pt'" command="ptPT">
        <svg-icon icon-class="pt" /> Português
      </el-dropdown-item>
      <el-dropdown-item :disabled="language==='br'" command="ptBR">
        <svg-icon icon-class="br" /> Português (Brasil)
      </el-dropdown-item>
    </el-dropdown-menu>
  </el-dropdown>
</template>

<script>

import VueCookies from 'vue-cookies'

export default {
  computed: {
    language() {
      return this.$store.getters.language
    }
  },
  methods: {
    handleSetLanguage(lang) {
      this.$i18n.locale = lang
      VueCookies.set('language', lang)
    }
  }
}
</script>
