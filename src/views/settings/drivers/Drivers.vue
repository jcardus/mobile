<template>
  <div>
    <transition name="modal">
      <div v-if="isOpenDriverForm">
        <div class="overlay">
          <div class="modal">
            <h2 v-if="isNewDriver">{{ $t('settings.driver_add') }}</h2>
            <h2 v-else>{{ $t('settings.driver_edit_title') }}</h2>
            <el-form>
              <el-form-item :label="$t('settings.driver_name')">
                <el-input v-model="driverName" />
              </el-form-item>
              <el-form-item :label="$t('settings.driver_email')">
                <el-input v-model="driverEmail" />
              </el-form-item>
              <el-form-item :label="$t('settings.driver_phone')">
                <el-input v-model="driverPhone" />
              </el-form-item>
            </el-form>
            <el-button
              type="info"
              class="alertFormButton"
              size="small"
              @click="handleCancelDriverForm"
            >{{ $t('settings.driver_form_cancel') }}</el-button>
            <el-button
              type="success"
              class="alertFormButton"
              size="small"
              @click="handleSubmitDriverForm"
            >{{ $t('settings.driver_form_confirm') }}</el-button>
          </div>
        </div>
      </div>
    </transition>
    <el-table
      height="calc(100vh - 125px)"
      :row-style="tableRowStyle"
      :header-cell-style="tableHeaderStyle"
      :data="drivers"
    >
      <el-table-column
        :label="$t('settings.driver_name')"
        prop="name"
        sortable
      >
      </el-table-column>
      <el-table-column
        :label="$t('settings.driver_email')"
        prop="attributes.email"
        sortable
      >
      </el-table-column>
      <el-table-column
        :label="$t('settings.driver_phone')"
        prop="attributes.phone"
        sortable
      >
      </el-table-column>
      <el-table-column label="" min-width="50px">
        <template slot="header">
          <el-tooltip :content="$t('settings.driver_add')" placement="top">
            <el-button
              class="formButton"
              size="small"
              @click="handleAddGroup"
            ><i class="fas fa-plus"></i></el-button>
          </el-tooltip>
        </template>
        <template slot-scope="scope">
          <el-tooltip :content="$t('settings.driver_delete')" placement="top">
            <el-button
              class="formButton"
              size="small"
              type="danger"
              @click="handleDelete(scope.row)"
            ><i class="fas fa-trash-alt"></i></el-button>
          </el-tooltip>
          <el-tooltip :content="$t('settings.driver_edit')" placement="top">
            <el-button
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
import { mapGetters } from 'vuex'

export default {
  name: 'DriversVue',
  data() {
    return {
      isOpenDriverForm: false,
      isNewDriver: true,
      selectedDriver: null,
      driverName: '',
      driverEmail: '',
      driverPhone: ''
    }
  },
  computed: {
    ...mapGetters(['drivers'])
  },
  methods: {
    tableRowStyle() {
      return 'font-size: 14px'
    },
    tableHeaderStyle() {
      return 'font-size: 14px'
    },
    handleAddGroup() {
      this.isNewDriver = true
      this.isOpenDriverForm = !this.isOpenDriverForm
    },
    handleEdit(row) {
      this.isNewDriver = false
      this.selectedDriver = row

      this.driverName = row.name
      this.driverEmail = row.attributes.email
      this.driverPhone = row.attributes.phone

      this.isOpenDriverForm = !this.isOpenDriverForm
    },
    handleDelete(row) {
      this.$confirm(this.$t('settings.driver_delete_info') + row.name, this.$t('settings.driver_delete_title'), {
        confirmButtonText: this.$t('settings.driver_form_confirm'),
        cancelButtonText: this.$t('settings.driver_form_cancel')
      }).then(() => {
        traccar.deleteDriver(row.id, this.driverDeleted)
      }).catch((error) => {
        this.$log.error(error)
      })
    },
    driverDeleted(id) {
      this.$log.debug('driver deleted')
      this.$message({
        message: this.$t('settings.driver_deleted'),
        type: 'success',
        duration: 5 * 1000
      })
      const driverDeleted = vm.$store.state.user.drivers.find(g => g.id === id)
      vm.$store.state.user.drivers.splice(vm.$store.state.user.drivers.indexOf(driverDeleted), 1)
    },
    handleCancelDriverForm() {
      this.isOpenDriverForm = false
      this.clearFormData()
    },
    handleSubmitDriverForm() {
      if (this.isNewDriver) {
        const newDriver = {
          name: this.driverName,
          attributes: {
            email: this.driverEmail,
            phone: this.driverPhone
          }
        }
        traccar.addDriver(newDriver, this.driverCreated)
      } else {
        this.$log.debug(this.selectedGroup)

        const driver = this.selectedDriver
        driver.name = this.driverName
        driver.attributes.email = this.driverEmail
        driver.attributes.phone = this.driverPhone

        const d = {
          id: driver.id,
          name: this.driverName,
          uniqueId: driver.uniqueId,
          attributes: {
            email: this.driverEmail,
            phone: this.driverPhone
          }
        }

        traccar.updateDriver(driver.id, d, this.driverUpdated)
      }

      this.isOpenDriverForm = false
      this.clearFormData()
    },
    driverCreated: function(newDriver) {
      this.$message({
        type: 'success',
        message: this.$t('settings.driver_created')
      })
      this.clearFormData()
      vm.$store.state.user.groups.push(newDriver)
    },
    driverUpdated: function() {
      this.$message({
        type: 'success',
        message: this.$t('settings.driver_updated')
      })
      this.clearFormData()
    },
    clearFormData() {
      this.selectedDriver = null
      this.driverName = ''
      this.driverEmail = ''
      this.driverPhone = ''
    }
  }
}
</script>

<style scoped>
  .formButton {
    float: right;
    margin-right: 10px;
  }
  .alertFormButton {
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
</style>
