<template>
  <div>
    <transition name="modal">
      <div v-if="isOpenTemporaryLinkForm">
        <div class="overlay">
          <div class="modal">
            <h2 v-if="isNewTemporaryLink">{{ $t('settings.temporary_link_add') }}</h2>
            <h2 v-else>{{ $t('settings.temporary_link_edit') }}</h2>
            <el-form ref="temporaryLink" :model="temporaryLinkForm" :rules="rules">
              <div class="form-item-block">
                <div class="form-item-row">
                  <el-form-item class="form-item-block-left" :label="$t('settings.user_name')">
                    <el-input v-model="temporaryLinkForm.name" />
                  </el-form-item>
                  <el-form-item class="form-item-block-right" :label="$t('settings.expiration_date')">
                    <el-date-picker v-model="temporaryLinkForm.expirationTime" type="datetime"></el-date-picker>
                  </el-form-item>
                </div>
              </div>
              <el-form-item>
                <el-transfer
                  v-model="temporaryLinkForm.linkSelectedDevices"
                  :filter-method="filteredDevices"
                  filterable
                  :filter-placeholder="$t('report.selector_search')"
                  :titles="[$t('settings.vehicles'), $t('report.select_vehicles')]"
                  :props="{
                    key: 'id',
                    label: 'name'
                  }"
                  :data="devices"
                >
                </el-transfer>
              </el-form-item>
            </el-form>
            <el-button
              type="info"
              class="formButton"
              size="small"
              @click="handleCancelForm"
            >{{ $t('settings.form_cancel') }}</el-button>
            <el-button
              :loading="loading"
              type="success"
              class="formButton"
              size="small"
              @click="handleSubmitForm"
            >{{ $t('settings.form_save') }}</el-button>
          </div>
        </div>
      </div>
    </transition>
    <el-table
      height="calc(100vh - 150px)"
      :row-style="tableRowStyle"
      :header-cell-style="tableHeaderStyle"
      :data="filteredUsers"
    >
      <el-table-column
        :label="$t('settings.user_name')"
        prop="name"
        sortable
      >
      </el-table-column>
      <el-table-column
        width="175px"
        :label="$t('settings.expiration_date')"
        sortable
      >
        <template slot-scope="scope">
          <span>{{ scope.row.expirationTime | moment("YYYY-MM-DD HH:mm:ss") }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('settings.user_temporary_link')">
        <template slot-scope="scope">
          <span>{{ externalLink(scope.row) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="" width="275px">
        <template slot="header" slot-scope="scope">
          <div style="float: left">
            <el-input
              v-model="search"
              :placeholder="$t('settings.search')"
              @chage="doNothing(scope)"
            />
          </div>
          <div style="float: right">
            <el-tooltip :content="$t('settings.add')" placement="top">
              <el-button
                class="formButton"
                size="small"
                @click="handleAdd"
              ><i class="fas fa-plus"></i></el-button>
            </el-tooltip>
          </div>
        </template>
        <template slot-scope="scope">
          <el-tooltip :content="$t('settings.delete')" placement="top">
            <el-button
              class="formButton"
              size="small"
              type="danger"
              @click="handleDelete(scope.row)"
            ><i class="fas fa-trash-alt"></i></el-button>
          </el-tooltip>
          <!--<el-tooltip :content="$t('settings.edit')" placement="top">
            <el-button
              :loading="loading"
              size="small"
              class="formButton"
              @click="handleEdit(scope.row)"
            ><i class="fas fa-edit"></i></el-button>
          </el-tooltip>-->
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      layout="total"
      :total="filteredUsers.length"
    >
    </el-pagination>
  </div>
</template>

<script>
import { vm } from '@/main'
import { mapGetters } from 'vuex'
import { traccar } from '@/api/traccar-api'
import Vue from 'vue'

export default {
  name: 'TemporaryLinks',
  data() {
    return {
      isOpenTemporaryLinkForm: false,
      isNewTemporaryLink: true,
      selectedTemporaryLink: null,
      search: '',
      loading: false,
      temporaryLinkForm: {
        name: '',
        expirationTime: '',
        linkDevices: [],
        linkSelectedDevices: []
      },
      rules: {
        name: [
          { required: true, message: this.$t('settings.name_required'), trigger: 'blur' }
        ]
      },
      filteredDevices(query, item) {
        if (item.attributes.license_plate) {
          return item.name.toLowerCase().indexOf(query.toLowerCase()) > -1 || item.attributes.license_plate.toLowerCase().indexOf(query.toLowerCase()) > -1
        }
      }
    }
  },
  computed: {
    ...mapGetters(['user', 'users', 'devices']),
    filteredUsers() {
      return this.users.filter(data => data.token).filter(data => (!this.search ||
        data.name.toLowerCase().includes(this.search.toLowerCase()) ||
        data.email.toLowerCase().includes(this.search.toLowerCase())))
    }
  },
  methods: {
    randomString() {
      return Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2)
    },
    externalLink(user) {
      return 'https://api.pinme.io/?token=' + user.token
    },
    tableRowStyle() {
      return 'font-size: 14px'
    },
    tableHeaderStyle() {
      return 'font-size: 14px'
    },
    async handleEdit(row) {

    },
    handleAdd() {
      const expirationDate = new Date()
      expirationDate.setHours(23)
      expirationDate.setMinutes(59)
      expirationDate.setSeconds(59)
      expirationDate.setDate(expirationDate.getDate() + 1)

      this.isNewTemporaryLink = true
      this.selectedTemporaryLink = null
      this.temporaryLinkForm.name = ''
      this.temporaryLinkForm.expirationTime = expirationDate
      this.temporaryLinkForm.linkDevices = []
      this.temporaryLinkForm.linkSelectedDevices = []
      this.isOpenTemporaryLinkForm = !this.isOpenTemporaryLinkForm
    },
    handleDelete(row) {
      this.$confirm(this.$t('settings.temporary_link_delete_info') + row.name, this.$t('settings.temporary_link_delete_title'), {
        confirmButtonText: this.$t('settings.form_confirm'),
        cancelButtonText: this.$t('settings.form_cancel')
      }).then(() => {
        traccar.deleteUser(row.id, this.userDeleted)
      }).catch((error) => {
        this.$log.error(error)
      })
    },
    userDeleted(id) {
      this.$log.debug('temporary link deleted')
      this.$message({
        message: this.$t('settings.temporary_link_deleted'),
        type: 'success',
        duration: 5 * 1000
      })
      const user = vm.$store.state.user.users.find(u => u.id === id)
      this.$store.dispatch('user/removeUser', user)
    },
    handleCancelForm() {
      this.isOpenTemporaryLinkForm = false
    },
    handleSubmitForm() {
      this.$refs.temporaryLink.validate(valid => {
        if (valid) {
          this.loading = true
          if (this.isNewTemporaryLink) {
            const token = this.randomString()
            const newUser = {
              name: this.temporaryLinkForm.name,
              email: 'temp_' + token,
              readonly: true,
              administrator: false,
              password: token,
              token: token,
              expirationTime: this.temporaryLinkForm.expirationTime,
              attributes: {
                'ui.disableReport': true,
                'ui.disableEvents': true,
                'ui.disableVehicleFeatures': true
              }
            }
            traccar.addUser(newUser)
              .then(response => this.userCreated(response.data))
              .catch(reason => {
                this.loading = false
                if (reason.response.data.startsWith('Duplicate entry')) {
                  this.$message({
                    message: this.$t('settings.user_duplicated_entry'),
                    type: 'warning',
                    duration: 5 * 1000
                  })
                } else if (reason.response.data.startsWith('Manager access required')) {
                  this.$message({
                    message: this.$t('settings.user_create_not_allowed'),
                    type: 'warning',
                    duration: 5 * 1000
                  })
                } else {
                  Vue.$log.error(reason)
                }
              })
          }
        }
      })
    },
    userCreated: async function(newUser) {
      try {
        await this.$store.dispatch('user/addUser', newUser)

        await this.updateUserPermissions(newUser)

        this.$message({
          type: 'success',
          message: this.$t('settings.temporary_link_created')
        })
      } catch (e) {
        Vue.$log.error(e)
      } finally {
        this.isOpenTemporaryLinkForm = false
        this.loading = false
      }
    },
    async updateUserPermissions(user) {
      Vue.$log.debug(user)
      Vue.$log.debug('Add permissions')
      const self = this

      const devicesToRemove = this.temporaryLinkForm.linkDevices.filter(x => !self.temporaryLinkForm.linkSelectedDevices.includes(x))
      const devicesToAdd = this.temporaryLinkForm.linkSelectedDevices.filter(x => !self.temporaryLinkForm.linkDevices.includes(x))

      Vue.$log.debug('Remove', devicesToRemove)
      Vue.$log.debug('Add', devicesToAdd)

      const devicesPermissionsToRemove = devicesToRemove.map(d => {
        return {
          userId: user.id,
          deviceId: d
        }
      })
      const devicesPermissionsToAdd = devicesToAdd.map(d => {
        return {
          userId: user.id,
          deviceId: d
        }
      })

      await traccar.deleteAllPermissions(devicesPermissionsToRemove)
      await traccar.addAllPermissions(devicesPermissionsToAdd)
    },
    doNothing(scope) {
      /* this method is here because we need the attribute 'slot-scope = "scope"' on the template
       for search box to work, but to be able to commit the variable 'scope' it must be used*/
    }
  }
}
</script>

<style lang="scss" scoped>
@import '../../../styles/element-variables.scss';

.form-item-row {
  display: table-row;
}

.form-item-block-left{
  display: table-cell;
  width: 300px;
  padding-right: 50px;
}
.form-item-block-right{
  width: 100px;
  display: table-cell;
}

.el-form-item__label {
  line-height: 30px;
}
.el-form-item {
  margin-bottom: 10px;
}
.formButton {
  float: right;
  margin-right: 10px;
}
.modal {
  width: 600px;
  margin: 0 auto;
  padding: 15px;
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
</style>
