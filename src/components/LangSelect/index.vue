<template>
  <el-dropdown trigger="click" class="international" @command="handleSetLanguage">
    <div>
      <svg-icon icon-class="international" />
    </div>
    <el-dropdown-menu slot="dropdown">
      <el-dropdown-item :disabled="language==='enGB'" command="enGB">
        <svg-icon icon-class="gb" /> English (UK)
      </el-dropdown-item>
      <el-dropdown-item :disabled="language==='frFR'" command="frFR">
        <svg-icon icon-class="fr" /> Française (Frace)
      </el-dropdown-item>
      <el-dropdown-item :disabled="language==='esCL'" command="esCL">
        <svg-icon icon-class="es" /> Español (Chile)
      </el-dropdown-item>
      <el-dropdown-item :disabled="language==='ptPT'" command="ptPT">
        <svg-icon icon-class="pt" /> Português (PT)
      </el-dropdown-item>
      <el-dropdown-item :disabled="language==='ptBR'" command="ptBR">
        <svg-icon icon-class="br" /> Português (BR)
      </el-dropdown-item>
    </el-dropdown-menu>
  </el-dropdown>
</template>

<script>

import { setLanguage } from '@/lang/index'

export default {
  computed: {
    language() {
      return this.$store.getters.language
    }
  },
  methods: {
    handleSetLanguage(lang) {
      setLanguage(lang)
    }
  }
}
</script>
