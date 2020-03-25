<template>
  <f7-page name="Groups">
    <f7-navbar back-link>
      <i class="fas fa-grip-horizontal" style="padding-right: 10px"></i> {{ $t('settings.groups') }}
      <f7-nav-right>
        <f7-link class="searchbar-enable" icon-ios="f7:search" icon-aurora="f7:search" icon-md="material:search"></f7-link>
      </f7-nav-right>
      <f7-searchbar
        expandable
        :placeholder="$t('settings.search')"
        search-container=".search-list"
        search-in=".item-title"
        :disable-button="!$theme.aurora"
      ></f7-searchbar>
    </f7-navbar>
    <f7-fab slot="fixed" position="right-top" color="gray" @click="onGroupAdd">
      <f7-icon ios="f7:plus" aurora="f7:plus" md="material:add"></f7-icon>
      <f7-icon ios="f7:xmark" aurora="f7:xmark" md="material:close"></f7-icon>
    </f7-fab>
    <f7-list class="searchbar-not-found">
      <f7-list-item :title="$t('settings.empty_list')"></f7-list-item>
    </f7-list>
    <f7-list
      class="search-list searchbar-found"
      style="padding-top: 45px;"
      media-list
      inset
      :virtual-list-params="{ items }"
    >
      <ul>
        <f7-list-item
          v-for="item in items"
          :key="item.id"
          media-item
          swipeout
          :title="item.name"
          @swipeout:deleted="onGroupDelete(item.id)"
        >
          <f7-swipeout-actions right>
            <f7-swipeout-button color="blue" @click="onGroupEdit(item)">{{ $t('settings.edit') }}</f7-swipeout-button>
            <f7-swipeout-button delete :confirm-title="$t('settings.group_delete_title')" :confirm-text="$t('settings.group_delete_info') + item.name">{{ $t('settings.delete') }}</f7-swipeout-button>
          </f7-swipeout-actions>
        </f7-list-item>
      </ul>
    </f7-list>
  </f7-page>
</template>

<script>
import { vm } from '../../../main'
import { traccar } from '../../../api/traccar-api'

export default {
  name: 'Groups',
  data() {
    return {
      selectedGroup: null,
      items: []
    }
  },
  computed:
  {
    groups: function() {
      return vm.$data.groups.sort((a, b) => (a.name > b.name) ? 1 : -1)
    },
    devices: function() {
      return vm.$data.devices
    }
  },
  mounted() {
    this.items = vm.$data.groups
  },
  methods: {
    onGroupDelete(groupId) {
      traccar.deleteGroup(groupId, this.groupDeleted)
    },
    onGroupAdd() {
      this.$f7.dialog.prompt(this.$t('settings.group_form_name'), this.$t('settings.group_add'),
        this.createGroup,
        this.cancelAdd,
        ''
      )
    },
    onGroupEdit(group) {
      this.selectedGroup = group
      this.$f7.dialog.prompt(this.$t('settings.group_form_name'), this.$t('settings.group_edit'),
        this.editGroup,
        this.cancelEdit,
        group.name
      )
    },
    createGroup(value) {
      const newGroup = {
        name: value
      }
      traccar.newGroup(newGroup, this.groupCreated)
    },
    editGroup(value) {
      traccar.editGroup(this.selectedGroup.id, this.selectedGroup, this.groupEdited)
      this.selectedGroup.name = value
    },
    cancelAdd(value) {
    },
    cancelEdit(value) {
      this.selectedGroup = null
    },
    groupCreated: function(newGroup) {
      this.groups.push(newGroup)
      this.$f7.dialog.alert(this.$t('settings.group_created'), this.$t('settings.group_add'))
    },
    groupEdited: function() {
      this.$f7.dialog.alert(this.$t('settings.group_updated'), this.$t('settings.group_edit'))
    },
    groupDeleted: function(groupId) {
      vm.$data.groups = vm.$data.groups.filter((e) => e && e.id !== groupId)
      this.$f7.dialog.alert(this.$t('settings.group_deleted'), this.$t('settings.group_delete_title'))
    }
  }
}
</script>

<style>
</style>
