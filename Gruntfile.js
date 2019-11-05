module.exports = function(grunt) {
  // Configure grunt
  grunt.initConfig({
    sprite: {
      all: {
        src: '1x/*.png',
        destCss: 'sprite.json',
        dest: 'sprite.png',
        cssVarMap: function(sprite) {
          sprite.pixelRatio = 1
        }
      },
      all2: {
        src: '2x/*.png',
        destCss: 'sprite@2x.json',
        dest: 'sprite@2x.png',
        cssVarMap: function(sprite) {
          sprite.pixelRatio = 2
        }
      }
    }
  })

  // Load in `grunt-spritesmith`
  grunt.loadNpmTasks('grunt-spritesmith')
}
