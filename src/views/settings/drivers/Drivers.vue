<template>
  <div>
    <transition name="modal">
      <div v-if="isOpenDriverForm">
        <div class="overlay">
          <div class="modal">
            <h2 v-if="isNewDriver">{{ $t('settings.driver_add_title') }}</h2>
            <h2 v-else>{{ $t('settings.driver_edit_title') }}</h2>
            <el-form ref="driver" :model="driverForm" :rules="rules">
              <el-form-item :label="$t('settings.driver_name')" prop="name">
                <el-input v-model="driverForm.name" />
              </el-form-item>
              <el-form-item :label="$t('settings.driver_uniqueId')" prop="uniqueId" @change.native="resetDuplicatedKeyValidator">
                <el-input v-model="driverForm.uniqueId" />
              </el-form-item>
              <el-form-item :label="$t('settings.driver_email')" prop="email">
                <el-input v-model="driverForm.email" />
              </el-form-item>
              <el-form-item :label="$t('settings.driver_phone')" prop="phone">
                <el-input v-model="driverForm.phone" type="number" />
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
      height="calc(100vh - 150px)"
      :row-style="tableRowStyle"
      :header-cell-style="tableHeaderStyle"
      :data="filteredDrivers"
    >
      <el-table-column
        :label="$t('settings.driver_name')"
        prop="name"
        sortable
      >
      </el-table-column>
      <el-table-column
        :label="$t('settings.driver_uniqueId')"
        prop="uniqueId"
        :formatter="formatUniqueId"
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
      <el-table-column label="" min-width="90px">
        <template slot="header" slot-scope="scope">
          <div style="float: left">
            <el-input
              v-model="search"
              placeholder="Pesquisa"
              @chage="doNothing(scope)"
            />
          </div>
          <div style="float: right">
            <el-tooltip :content="$t('settings.driver_add')" placement="top">
              <el-button
                class="formButton"
                size="small"
                @click="handleAddGroup"
              ><i class="fas fa-plus"></i></el-button>
            </el-tooltip>
          </div>
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
    <el-pagination
      layout="total"
      :total="filteredDrivers.length"
    >
    </el-pagination>
  </div>
</template>

<script>
import { vm } from '../../../main'
import { traccar } from '../../../api/traccar-api'
import { mapGetters } from 'vuex'
import Vue from 'vue'

export default {
  name: 'Drivers',
  data() {
    const isDuplicatedKey = (rule, value, callback) => {
      if (this.isUniqueIdDuplicated) {
        return callback(new Error())
      }
      callback()
    }
    const checkEmailRequired = (rule, value, callback) => {
      if ((!value || value.length === 0) && this.driverForm.phone.length === 0) {
        return callback(new Error())
      }
      callback()
    }
    const checkPhoneRequired = (rule, value, callback) => {
      if ((!value || value.length === 0) && this.driverForm.email.length === 0) {
        return callback(new Error())
      }
      callback()
    }
    return {
      isOpenDriverForm: false,
      isNewDriver: true,
      selectedDriver: null,
      isUniqueIdDuplicated: false,
      search: '',
      driverForm: {
        name: '',
        uniqueId: '',
        email: '',
        phone: ''
      },
      rules: {
        name: [
          { required: true, message: this.$t('settings.name_required'), trigger: 'blur' }
        ],
        uniqueId: [
          { validator: isDuplicatedKey, message: this.$t('settings.uniqueId_duplicated'), trigger: 'blur' }
        ],
        email: [
          { type: 'email', message: this.$t('settings.email_format_invalid'), trigger: 'blur' },
          { validator: checkEmailRequired, message: this.$t('settings.email_or_phone_required'), trigger: 'blur' }
        ],
        phone: [
          { validator: checkPhoneRequired, message: this.$t('settings.email_or_phone_required'), trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    ...mapGetters(['drivers']),
    filteredDrivers() {
      return this.drivers.filter(data => !this.search ||
        data.name.toLowerCase().includes(this.search.toLowerCase()) ||
        data.uniqueId.toLowerCase().includes(this.search.toLowerCase()) ||
        (data.attributes.email && data.attributes.email.toLowerCase().includes(this.search.toLowerCase())) ||
        (data.attributes.phone && data.attributes.phone.toLowerCase().includes(this.search.toLowerCase())))
    }
  },
  methods: {
    tableRowStyle() {
      return 'font-size: 14px'
    },
    tableHeaderStyle() {
      return 'font-size: 14px'
    },
    formatUniqueId(row, column, cellValue) {
      if (cellValue) {
        return cellValue.startsWith('_driver_') ? '' : cellValue
      } else {
        return ''
      }
    },
    handleAddGroup() {
      this.isNewDriver = true
      this.selectedDriver = null
      this.driverForm.name = ''
      this.driverForm.uniqueId = ''
      this.driverForm.email = ''
      this.driverForm.phone = ''
      this.isOpenDriverForm = !this.isOpenDriverForm
    },
    handleEdit(row) {
      this.isNewDriver = false
      this.selectedDriver = row

      this.driverForm.name = row.name
      this.driverForm.uniqueId = row.uniqueId.startsWith('_driver_') ? '' : row.uniqueId
      this.driverForm.email = row.attributes.email
      this.driverForm.phone = row.attributes.phone

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
      const driver = vm.$store.state.user.drivers.find(g => g.id === id)
      this.$store.dispatch('user/removeDriver', driver)
    },
    handleCancelDriverForm() {
      this.isOpenDriverForm = false
    },
    handleSubmitDriverForm() {
      this.$refs.driver.validate(valid => {
        if (valid) {
          if (this.isNewDriver) {
            const newDriver = {
              name: this.driverForm.name,
              uniqueId: this.driverForm.uniqueId.length === 0 ? this.createUniqueID() : this.driverForm.uniqueId,
              attributes: {
                email: this.driverForm.email,
                phone: this.driverForm.phone
              }
            }
            traccar.addDriver(newDriver, this.driverCreated)
          } else {
            this.$log.debug(this.selectedGroup)

            const driver = this.selectedDriver
            driver.name = this.driverForm.name
            driver.uniqueId = this.driverForm.uniqueId.length === 0 ? this.createUniqueID() : this.driverForm.uniqueId
            driver.attributes.email = this.driverForm.email
            driver.attributes.phone = this.driverForm.phone

            const d = {
              id: driver.id,
              name: this.driverForm.name,
              uniqueId: driver.uniqueId,
              attributes: {
                email: this.driverForm.email,
                phone: this.driverForm.phone
              }
            }

            traccar.updateDriver(driver.id, d, this.driverUpdated, this.driverUniqueIdDuplicated)
          }
        }
      })
    },
    createUniqueID() {
      return '_driver_' + vm.$store.state.user.userId + '_' + Vue.moment.now()
    },
    driverCreated: function(newDriver) {
      this.$message({
        type: 'success',
        message: this.$t('settings.driver_created')
      })
      this.isOpenDriverForm = false
      this.$store.dispatch('user/addDriver', newDriver)
    },
    driverUpdated: function() {
      this.$message({
        type: 'success',
        message: this.$t('settings.driver_updated')
      })
      this.isOpenDriverForm = false
    },
    driverUniqueIdDuplicated: function() {
      this.isUniqueIdDuplicated = true
      this.$refs.driver.validate()
    },
    resetDuplicatedKeyValidator() {
      this.isUniqueIdDuplicated = false
    },
    doNothing(scope) {
      /* this method is here because we need the attribute 'slot-scope = "scope"' on the template
       for search box to work, but to be able to commit the variable 'scope' it must be used*/
    }
  }
}
</script>

<style scoped lang="scss">
  @import '../../../styles/element-variables.scss';

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
    border-radius: 10px;
    box-shadow: 0 2px 8px 3px;
    transition: all 0.2s ease-in;
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

  .el-pagination__total{
    color: $--color-primary
  }
</style>
