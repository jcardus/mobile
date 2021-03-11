<template>
  <el-dropdown trigger="click" class="international" @command="handleSetLanguage">
    <div>
    </div>
    <el-dropdown-menu slot="dropdown">
      <el-dropdown-item :disabled="language==='enGB'" command="enGB">
        English (UK)
      </el-dropdown-item>
      <el-dropdown-item :disabled="language==='frFR'" command="frFR">
        Française (FR)
      </el-dropdown-item>
      <el-dropdown-item :disabled="language==='esCL'" command="esCL">
        Español (Chile)
      </el-dropdown-item>
      <el-dropdown-item :disabled="language==='ptPT'" command="ptPT">
        Português (PT)
      </el-dropdown-item>
      <el-dropdown-item :disabled="language==='ptBR'" command="ptBR">
        Português (BR)
      </el-dropdown-item>
    </el-dropdown-menu>
  </el-dropdown>
</template>

<script>

import { setLanguage } from '@/lang'

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
