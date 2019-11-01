export default {
  route: {
    map: 'Map',
    dashboard: 'Dashboard',
    reports: 'Reports',
    report_trip_title: 'Trip Report',
    report_location_title: 'Location Report',
    report_zone_crossing: 'Zone Report',
    settings: 'Settings',
    duration: 'Duration'
  },
  map: {
    geofence_create_title: 'New geofence',
    geofence_create_name: 'Please enter the name of this geofence...',
    geofence_created: 'Geofence created sucessfully!',
    geofence_create_canceled: 'Input canceled',
    poi_create_title: 'New POI',
    poi_create_name: 'Please enter the name of this POI...',
    poi_created: 'POI created sucessfully!',
    poi_create_canceled: 'Input canceled',
    create_confirm: 'OK',
    create_cancel: 'Cancel'
  },
  vehicleList: {
    title: 'Vehicle',
    search: 'Search...',
    column_name: 'Name',
    column_speed: 'Km/h',
    column_lastUpdate: 'Last update'
  },
  vehicleTable: {
    immobilize: 'Immobilize',
    de_immobilize: 'De-Immobilize',
    send_immobilization: 'Send immobilization command?',
    send_de_immobilization: 'Send de-immobilization command?'
  },
  vehicleDetail: {
    show_route: 'Show route'
  },
  poiTable: {
    showPOIs: 'Show POIs'
  },
  dashboard: {
    startdate: 'Start date',
    enddate: 'End Date',
    period_lastweek: 'Last week',
    period_lastmonth: 'Last month',
    period_last3month: 'Last 3 months'
  },
  navbar: {
    profile: 'Profile',
    settings: 'Settings',
    logout: 'Log Out'
  },
  login: {
    login_user: 'Email',
    login_password: 'Password',
    login_button: 'Login',
    login_password_warn: 'The password can not be less than 6 digits'
  },
  profile: {
    user_account: 'Account',
    user_name: 'Name',
    user_email: 'E-mail',
    user_password: 'Password',
    user_phone: 'Phone',
    user_language: 'Language',
    user_timezone: 'Timezone',
    user_update_button: 'Update',
    user_updated: 'User information has been updated successfully.',
    user_name_required: 'Name field is required',
    user_email_required: 'Please input a valid email',
    user_password_lengh: 'The password can not be less than 6 digits'
  },
  settings: {
    title: 'Settings',
    route_match: 'Route match',
    alerts: 'Alerts',
    alerts_type: 'Type',
    alerts_notificators: 'Notificators',
    alert_ignitionOff: 'Ignition Off',
    alert_ignitionOn: 'Ignition On',
    alert_geofenceEnter: 'Geofence Enter',
    alert_geofenceExit: 'Geofence Exit',
    alert_deviceOverspeed: 'Device Overspeed',
    alert_deleted: 'Alert has been deleted',
    alert_delete_info: 'Do you want to delete the alert ',
    alert_delete_title: 'Delete Alert',
    alert_edit_confirm: 'Confirm',
    alert_edit_cancel: 'Cancel',
    alert_created: 'Alert created sucessfully!',
    alert_updated: 'Alert updated sucessfully!',
    alert_add: 'Add Alert',
    alert_edit: 'Edit Alert',
    alert_delete: 'Delete Alert',
    alert_overspeed_warning: 'Vehicle without defined top speed',
    alert_geofences_warning: 'Vehicle without associated geofences',
    alert_associate_geofences: 'Associate Geofences',
    alert_form_type: 'Type:',
    alert_form_type_placeholder: 'Select alert type',
    alert_form_vehicles: 'Vehicles:',
    alert_form_geofences: 'Geofences:',
    alert_form_all_vehicles: 'All vehicles',
    alert_form_vehicles_placeholder: 'Select vehicles',
    alert_form_notificator_web: 'Web',
    alert_form_notificator_email: 'E-mail',
    alert_form_notificator_sms: 'SMS',
    alert_form_confirm: 'Save',
    alert_form_cancel: 'Cancel',
    alert_form_geofences_placeholder: 'Select geofences'
  },
  geofence: {
    showGeofences: 'Show Geofences',
    geofence_name: 'Name',
    geofence_edit: 'Edit',
    geofence_delete: 'Delete',
    geofence_deleted: 'Geofence has been deleted',
    geofence_delete_info: 'Do you want to delete geofence ',
    geofence_delete_title: 'Delete Geofence',
    geofence_edit_title: 'Edit Geofence',
    geofence_edit_name: 'Please enter the name of this geofence...',
    geofence_edit_confirm: 'Confirm',
    geofence_edit_cancel: 'Cancel',
    geofence_edit_canceled: 'Edit canceled',
    geofence_edited: 'Geofence edited sucessfully!',
    poi_delete_info: 'Do you want to delete POI ',
    poi_delete_title: 'Delete POI',
    poi_edited: 'POI edited sucessfully!',
    poi_deleted: 'POI has been deleted',
    poi_edit_title: 'Edit POI',
    poi_edit_name: 'Please enter the name of this POI...'
  },
  report: {
    select_vehicles: 'Select vehicles',
    select_vehicles_placeholder: 'Vehicles',
    select_geofences: 'Select geofences',
    select_geofences_placeholder: 'Geofences',
    select_period: 'Select period',
    date_start: 'Start date',
    date_end: 'End date',
    generate_report: 'Generate report'
  }
}
