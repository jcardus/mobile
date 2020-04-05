<template>
  <div v-if="dataLoaded">
    <transition name="modal">
      <div v-if="isOpenGroupForm">
        <div class="overlay">
          <div class="modal">
            <h2 v-if="isNewGroup">{{ $t('settings.group_add') }}</h2>
            <h2 v-else>{{ $t('settings.group_edit') }}</h2>
            <el-form>
              <el-form-item :label="$t('settings.group_form_name')">
                <el-input v-model="groupName" />
              </el-form-item>
            </el-form>
            <el-button
              type="info"
              class="formButton"
              size="small"
              @click="handleCancelGroupForm"
            >{{ $t('settings.group_form_cancel') }}</el-button>
            <el-button
              type="success"
              class="formButton"
              size="small"
              @click="handleSubmitGroupForm"
            >{{ $t('settings.group_form_confirm') }}</el-button>
          </div>
        </div>
      </div>
    </transition>
    <el-table
      height="calc(100vh - 125px)"
      :data="groups"
      :row-style="tableRowStyle"
      :header-cell-style="tableHeaderStyle"
    >
      <el-table-column
        :label="$t('settings.group_name')"
        prop="name"
        sortable
      >
      </el-table-column>
      <el-table-column
        label="Nº Veículos"
        :formatter="totalVehiclesRederer"
        prop="id"
      >
      </el-table-column>
      <el-table-column label="" min-width="50px">
        <template slot="header">
          <el-tooltip content="Adicionar Grupo" placement="top">
            <el-button
              class="formButton"
              size="small"
              @click="handleAddGroup"
            ><i class="fas fa-plus"></i></el-button>
          </el-tooltip>
        </template>
        <template slot-scope="scope">
          <el-tooltip :content="$t('settings.group_delete')" placement="top">
            <el-button
              v-if="!isMobile"
              class="formButton"
              size="small"
              type="danger"
              @click="handleDelete(scope.row)"
            ><i class="fas fa-trash-alt"></i></el-button>
          </el-tooltip>
          <el-tooltip :content="$t('settings.group_edit')" placement="top">
            <el-button
              v-if="!isMobile"
              size="small"
              class="formButton"
              @click="handleEdit(scope.row)"
            ><i class="fas fa-edit"></i></el-button>
          </el-tooltip>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import { vm } from '../../../main'
import { traccar } from '../../../api/traccar-api'
import * as lnglat from '../../../utils/lnglat'
import { mapGetters } from 'vuex'

export default {
  name: 'Groups',
  data() {
    return {
      isOpenGroupForm: false,
      isNewGroup: true,
      selectedGroup: null,
      groupName: ''
    }
  },
  computed: {
    ...mapGetters(['dataLoaded']),
    isMobile() { return lnglat.isMobile() },
    devices: function() {
      if (vm.$data.devices) {
        return vm.$data.devices.sort((a, b) => (a.name > b.name) ? 1 : -1)
      }
      return []
    },
    groups: function() {
      if (vm.$store.state.user.groups) {
        return vm.$store.state.user.groups.sort((a, b) => (a.name > b.name) ? 1 : -1)
      }
      return []
    }
  },
  methods: {
    handleCancelGroupForm() {
      this.isOpenGroupForm = false
      this.clearFormData()
    },
    handleSubmitGroupForm() {
      if (this.isNewGroup) {
        const newGroup = {
          name: this.groupName
        }
        traccar.newGroup(newGroup, this.groupCreated)
      } else {
        this.$log.debug(this.selectedGroup)

        const group = this.selectedGroup
        group.name = this.groupName

        const g = {
          id: group.id,
          attributes: {},
          groupId: group.groupId,
          name: group.name
        }

        traccar.editGroup(group.id, g, this.groupUpdated)
      }
      this.isOpenGroupForm = false
    },
    groupCreated: function(newGroup) {
      this.$message({
        type: 'success',
        message: this.$t('settings.group_created')
      })
      this.clearFormData()
      vm.$store.state.user.groups.push(newGroup)
    },
    groupUpdated: function() {
      this.$message({
        type: 'success',
        message: this.$t('settings.group_updated')
      })
      this.clearFormData()
    },
    handleAddGroup() {
      this.isNewGroup = true
      this.isOpenGroupForm = !this.isOpenAlertForm
    },
    handleEdit(row) {
      this.isNewGroup = false
      this.selectedGroup = row
      this.groupName = row.name
      this.isOpenGroupForm = !this.isOpenGroupForm
    },
    tableRowStyle() {
      return 'font-size: 14px'
    },
    tableHeaderStyle() {
      return 'font-size: 14px'
    },
    totalVehiclesRederer(row, column, cellValue) {
      if (cellValue) {
        return vm.$data.devices.filter(d => d.groupId === cellValue).length
      } else {
        return ''
      }
    },
    handleDelete(row) {
      this.$confirm(this.$t('settings.group_delete_info') + row.name, this.$t('settings.group_delete_title'), {
        confirmButtonText: this.$t('settings.group_edit_confirm'),
        cancelButtonText: this.$t('settings.group_edit_cancel')
      }).then(() => {
        traccar.deleteGroup(row.id, this.groupDeleted)
      }).catch(() => {
      })
    },
    groupDeleted(id) {
      this.$log.debug('group deleted')
      this.$message({
        message: this.$t('settings.group_deleted'),
        type: 'success',
        duration: 5 * 1000
      })
      const groupDeleted = vm.$store.state.user.groups.find(g => g.id === id)
      vm.$store.state.user.groups.splice(vm.$store.state.user.groups.indexOf(groupDeleted), 1)
    },
    clearFormData() {
      this.groupName = ''
    }
  }
}
</script>

<style scoped>
  .formButton {
    float: right;
    margin-right: 10px;
  }
  .modal {
    width: 500px;
    margin: 0 auto;
    padding: 20px;
    background-color: #fff;
    border-radius: 2px;
    box-shadow: 0 2px 8px 3px;
    transition: all 0.2s ease-in;
    font-family: Helvetica, Arial, sans-serif;
  }
  .fadeIn-enter .modal,
  .overlay {
    position: fixed;
    top: 0;
    left: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    background: #00000094;
    z-index: 999;
    transition: opacity 0.2s ease;
  }

  .el-table .tomobile td:last-child {
    font-size: 12px
  }
</style>
