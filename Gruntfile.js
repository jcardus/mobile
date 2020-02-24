module.exports = function(grunt) {
  // Configure grunt
  grunt.initConfig({
    'convert-svg-to-png': {
      fallback: {
        options: {
          size: { w: 100, h: 100 }
        },
        files: [{
          expand: true,
          src: ['maki/11/*.svg', 'maki/15/*.svg'],
          dest: '1x'
        }]
      }
    },
    sprite: {
      all: {
        src: '1x/**/*.png',
        destCss: 'public/img/sprite.json',
        dest: 'public/img/sprite.png',
        cssVarMap: function(sprite) {
          sprite.pixelRatio = 1
        }
      },
      all2: {
        src: '2x/**/*.png',
        destCss: 'public/img/sprite@2x.json',
        dest: 'public/img/sprite@2x.png',
        cssVarMap: function(sprite) {
          sprite.pixelRatio = 2
        }
      }
    }
  })

  // Load in `grunt-spritesmith`
  grunt.loadNpmTasks('grunt-spritesmith')
  grunt.loadNpmTasks('grunt-convert-svg-to-png')
  grunt.loadNpmTasks('grunt-move')
}
