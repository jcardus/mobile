import Vue from 'vue'

export function load() {
  return new Promise((resolve) => {
    Vue.loadScript('stimulsoft/stimulsoft.reports.js').then(() => {
      Vue.loadScript('stimulsoft/stimulsoft.viewer.js').then(() => {
      // eslint-disable-next-line no-undef
        Stimulsoft.Base.StiLicense.key = '6vJhGtLLLz2GNviWmUTrhSqnOItdDwjBylQzQcAOiHkZYSgEPVMFImkD/7Y5Z9JkpEv1HtFmmLrNoeiu66YaCoYDdC' +
        'MCtxdHWAHw65t6SWsTyEwke7/XB32/bbpxF0TkTR/yx44eVmIKyLv0LT1Umy8vHTAAtWJOttxKMS6ImhYFBqdE5806' +
        'uBRfIyVN2AzzQT4xX+79X8X23SWMNuLcRbVE5xpfFF8NfIpQ/sRJRjS362F0fNhrY8YHpr5QnZ57y4AtvE5JyCMR1Q' +
        'wgAhQS6yieoEeRA+kN7txYpVzTsmPsrIPBD7dPVZlsV9bWsi+o65givp8oGCGzogKKYEpqTzsmYzgQy1Q383e8l+hO' +
        'gIy7wmoeMxTwlAhW1OTLuQHhe/HXRynTYeI86Alu1tXYrIYgy+57ndnwCC+W5c+wV3wAaXk98U15lnO8w7OnGJB279' +
        'YlQSQVxkdOCuiqsDrn6JZtSixHIweBOEzhhkF0ZSD5Gsdwmd3YJ9GGSBdTSNJHQ+PAXxbH5cl+cTCOdj+SvVLYCPR8' +
        'STT4NtuXavDCjgiKzyJ6YS2hJf+UgP4Lx5K0'

        // eslint-disable-next-line no-undef
        const options = new Stimulsoft.Viewer.StiViewerOptions()

        // eslint-disable-next-line no-undef
        options.appearance.interfaceType = Stimulsoft.Viewer.StiInterfaceType.Touch

        options.appearance.showPageShadow = true
        options.appearance.showTooltips = false

        options.appearance.allowTouchZoom = true
        // options.appearance.scrollbarsMode = true

        options.toolbar.showAboutButton = false
        options.toolbar.showOpenButton = false
        options.toolbar.showNextPageButton = false
        options.toolbar.showPreviousPageButton = false
        options.toolbar.showLastPageButton = false
        options.toolbar.showFirstPageButton = false
        options.toolbar.showCurrentPageControl = false
        options.toolbar.showBookmarksButton = false
        options.toolbar.showParametersButton = false
        options.toolbar.showResourcesButton = false
        options.toolbar.showViewModeButton = false
        options.toolbar.showButtonCaptions = false

        // eslint-disable-next-line no-undef
        options.toolbar.viewMode = Stimulsoft.Viewer.StiWebViewMode.Continuous
        // eslint-disable-next-line no-undef
        options.toolbar.showMenuMode = Stimulsoft.Viewer.StiShowMenuMode.Click
        // eslint-disable-next-line no-undef
        options.toolbar.printDestination = Stimulsoft.Viewer.StiPrintDestination.Direct

        // eslint-disable-next-line no-undef
        resolve(new Stimulsoft.Viewer.StiViewer(options, 'StiViewer', false),
          // eslint-disable-next-line no-undef
          new Stimulsoft.Report.StiReport())
      })
    })
  })
}
