<template>
  <div>
    <transition name="modal">
      <div v-if="isOpenUserForm">
        <div class="overlay">
          <div class="modal">
            <h2 v-if="isNewUser">{{ $t('settings.user_add') }}</h2>
            <h2 v-else>{{ $t('settings.user_edit') }}</h2>
            <el-form ref="user" :model="userForm" :rules="rules">
              <el-select v-model="userForm.userType" value="" :placeholder="$t('settings.user_form_type_placeholder')">
                <el-option v-for="type in userTypes" :key="type.value" :value="type.value" :label="$t('profile.'+type.text)" />
              </el-select>
              <el-form-item :label="$t('settings.user_name')">
                <el-input v-model="userForm.name" />
              </el-form-item>
              <el-form-item :label="$t('settings.user_email')">
                <el-input v-model="userForm.email" />
              </el-form-item>
              <el-form-item :label="$t('settings.user_password')">
                <el-input
                  :key="passwordType"
                  ref="password"
                  v-model="userForm.password"
                  :show-password="true"
                  :type="passwordType"
                  name="password"
                />
              </el-form-item>
              <el-form-item :label="$t('settings.user_phone')">
                <el-input v-model="userForm.phone" />
              </el-form-item>
            </el-form>
            <el-button
              type="info"
              class="formButton"
              size="small"
              @click="handleCancelForm"
            >{{ $t('settings.form_cancel') }}</el-button>
            <el-button
              type="success"
              class="formButton"
              size="small"
              @click="handleSubmitForm"
            >{{ $t('settings.form_confirm') }}</el-button>
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
      <el-table-column :label="$t('settings.user_type')">
        <template slot-scope="scope">
          <span>{{ userType(scope.row) }}</span>
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('settings.user_name')"
        prop="name"
        sortable
      >
      </el-table-column>
      <el-table-column
        :label="$t('settings.user_email')"
        prop="email"
        sortable
      >
      </el-table-column>
      <el-table-column
        :label="$t('settings.user_phone')"
        prop="phone"
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
                @click="handleAddUser"
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
      :total="filteredUsers.length"
    >
    </el-pagination>
  </div>
</template>

<script>
import { vm } from '@/main'
import { traccar } from '@/api/traccar-api'
import { mapGetters } from 'vuex'

export default {
  name: 'Users',
  data() {
    return {
      isOpenUserForm: false,
      isNewUser: true,
      selectedUser: null,
      search: '',
      userForm: {
        name: '',
        email: '',
        phone: '',
        password: '',
        userType: ''
      },
      userTypes: [
        { value: 'manager', text: 'user_type_manager' },
        { value: 'operator', text: 'user_type_operator' }
      ],
      rules: {
        name: [
          { required: true, message: this.$t('settings.name_required'), trigger: 'blur' }
        ],
        email: [
          { type: 'email', message: this.$t('settings.email_format_invalid'), trigger: 'blur' },
          { required: true, message: this.$t('settings.email_required'), trigger: 'blur' }
        ],
        password: [
          { required: true, min: 6, message: this.$t('profile.user_password_lengh'), trigger: 'blur' }
        ]
      },
      passwordType: 'password'
    }
  },
  computed: {
    ...mapGetters(['users']),
    filteredUsers() {
      return this.users.filter(data => !this.search ||
        data.name.toLowerCase().includes(this.search.toLowerCase()) ||
        data.email.toLowerCase().includes(this.search.toLowerCase()))
    }
  },
  methods: {
    tableRowStyle() {
      return 'font-size: 14px'
    },
    tableHeaderStyle() {
      return 'font-size: 14px'
    },
    userType(user) {
      if (user.readonly) {
        return this.$t('profile.user_type_operator')
      }

      return this.$t('profile.user_type_manager')
    },
    handleAddUser() {
      this.isNewUser = true
      this.selectedUser = null
      this.userForm.name = ''
      this.userForm.email = ''
      this.userForm.phone = ''
      this.userForm.password = ''

      this.isOpenUserForm = !this.isOpenUserForm
    },
    handleEdit(row) {
      this.isNewUser = false
      this.selectedUSer = row

      this.userForm.name = row.name
      this.userForm.email = row.email
      this.userForm.phone = row.phone
      this.userForm.password = row.password
      this.userForm.userType = row.readonly ? 'operator' : 'manager'

      this.isOpenUserForm = !this.isOpenUserForm
    },
    handleDelete(row) {
      this.$confirm(this.$t('settings.user_delete_info') + row.name, this.$t('settings.user_delete_title'), {
        confirmButtonText: this.$t('settings.form_confirm'),
        cancelButtonText: this.$t('settings.form_cancel')
      }).then(() => {
        traccar.deleteUser(row.id, this.userDeleted)
      }).catch((error) => {
        this.$log.error(error)
      })
    },
    handleCancelForm() {
      this.isOpenUserForm = false
    },
    handleSubmitForm() {
      this.$refs.user.validate(valid => {
        if (valid) {
          if (this.isNewUser) {
            const newUser = {
              name: this.userForm.name,
              email: this.userForm.email,
              phone: this.userForm.phone,
              password: this.userForm.password,
              readonly: this.userForm.userType === 'operator',
              deviceReadonly: this.userForm.userType === 'manager'
            }
            traccar.addUser(newUser)
              .then(this.userCreated)
              .catch(reason => {
                if (reason.response.data.startsWith('Duplicate entry')) {
                  this.$message({
                    message: 'Utilizador já existe.',
                    type: 'warning',
                    duration: 5 * 1000
                  })
                }
              })
          } else {
            this.$log.debug(this.selectedUser)

            const user = this.selectedUser
            user.name = this.userForm.name
            user.email = this.userForm.email
            user.phone = this.userForm.phone
            user.password = this.userForm.password

            traccar.updateUser(user.id, user, this.userUpdated)
          }
        }
      })
    },
    userCreated: function(newUser) {
      this.$message({
        type: 'success',
        message: this.$t('settings.user_created')
      })
      this.isOpenDriverForm = false
      this.$store.dispatch('user/addUser', newUser)
    },
    userUpdated: function() {
      this.$message({
        type: 'success',
        message: this.$t('settings.user_updated')
      })
      this.isOpenDriverForm = false
    },
    userDeleted(id) {
      this.$log.debug('user deleted')
      this.$message({
        message: this.$t('settings.user_deleted'),
        type: 'success',
        duration: 5 * 1000
      })
      const user = vm.$store.state.user.users.find(u => u.id === id)
      this.$store.dispatch('user/removeUser', user)
    },
    doNothing(scope) {
      /* this method is here because we need the attribute 'slot-scope = "scope"' on the template
       for search box to work, but to be able to commit the variable 'scope' it must be used*/
    }
  }
}
</script>

<style lang="scss">
  @import '../../../styles/element-variables.scss';

  .formButton {
    float: right;
    margin-right: 10px;
  }
  .modal {
    width: 500px;
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
