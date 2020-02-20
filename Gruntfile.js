module.exports = function(grunt) {
  // Configure grunt
  grunt.initConfig({
    sprite: {
      all: {
        src: '1x/*.png',
        destCss: 'public/img/sprite.json',
        dest: 'public/img/sprite.png',
        cssVarMap: function(sprite) {
          sprite.pixelRatio = 1
        }
      },
      all2: {
        src: '1x/*.png',
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
}
