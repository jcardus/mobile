<template>
  <IOdometer
    class="iOdometer"
    style="margin-right: 4px;margin-top:4px;margin-bottom:4px;font-size: 0.8em;opacity: 45%"
    theme="car"
    format="(,ddd).d"
    :value="value"
  />
</template>
<script>
import IOdometer from 'vue-odometer'
export default {
  name: 'VIOdometer',
  components: { IOdometer },
  props: {
    value: {
      type: Number,
      default: 0
    }
  }
}
</script>
<style lang="scss" scoped>
    .odometer.odometer-auto-theme, .odometer.odometer-theme-car {
      display: inline-block;
      vertical-align: middle;
      *vertical-align: auto;
      *zoom: 1;
      *display: inline;
      position: relative;
      background: white;
      font-weight: 600;
    }
    .odometer.odometer-auto-theme .odometer-digit, .odometer.odometer-theme-car .odometer-digit {
      display: inline-block;
      vertical-align: middle;
      *vertical-align: auto;
      *zoom: 1;
      *display: inline;
      position: relative;
    }
    .odometer.odometer-auto-theme .odometer-digit .odometer-digit-spacer, .odometer.odometer-theme-car .odometer-digit .odometer-digit-spacer {
      display: inline-block;
      vertical-align: middle;
      *vertical-align: auto;
      *zoom: 1;
      *display: inline;
      visibility: hidden;
    }
    .odometer.odometer-auto-theme .odometer-digit .odometer-digit-inner, .odometer.odometer-theme-car .odometer-digit .odometer-digit-inner {
      text-align: left;
      display: block;
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      overflow: hidden;
    }
    .odometer.odometer-auto-theme .odometer-digit .odometer-ribbon, .odometer.odometer-theme-car .odometer-digit .odometer-ribbon {
      display: block;
    }
    .odometer.odometer-auto-theme .odometer-digit .odometer-ribbon-inner, .odometer.odometer-theme-car .odometer-digit .odometer-ribbon-inner {
      display: block;
      -webkit-backface-visibility: hidden;
    }
    .odometer.odometer-auto-theme .odometer-digit .odometer-value, .odometer.odometer-theme-car .odometer-digit .odometer-value {
      display: block;
      -webkit-transform: translateZ(0);
    }
    .odometer.odometer-auto-theme .odometer-digit .odometer-value.odometer-last-value, .odometer.odometer-theme-car .odometer-digit .odometer-value.odometer-last-value {
      position: absolute;
    }
    .odometer.odometer-auto-theme.odometer-animating-up .odometer-ribbon-inner, .odometer.odometer-theme-car.odometer-animating-up .odometer-ribbon-inner {
      -webkit-transition: -webkit-transform 2s;
      -moz-transition: -moz-transform 2s;
      -ms-transition: -ms-transform 2s;
      -o-transition: -o-transform 2s;
      transition: transform 2s;
    }
    .odometer.odometer-auto-theme.odometer-animating-up.odometer-animating .odometer-ribbon-inner, .odometer.odometer-theme-car.odometer-animating-up.odometer-animating .odometer-ribbon-inner {
      -webkit-transform: translateY(-100%);
      -moz-transform: translateY(-100%);
      -ms-transform: translateY(-100%);
      -o-transform: translateY(-100%);
      transform: translateY(-100%);
    }
    .odometer.odometer-auto-theme.odometer-animating-down .odometer-ribbon-inner, .odometer.odometer-theme-car.odometer-animating-down .odometer-ribbon-inner {
      -webkit-transform: translateY(-100%);
      -moz-transform: translateY(-100%);
      -ms-transform: translateY(-100%);
      -o-transform: translateY(-100%);
      transform: translateY(-100%);
    }
    .odometer.odometer-auto-theme.odometer-animating-down.odometer-animating .odometer-ribbon-inner, .odometer.odometer-theme-car.odometer-animating-down.odometer-animating .odometer-ribbon-inner {
      -webkit-transition: -webkit-transform 2s;
      -moz-transition: -moz-transform 2s;
      -ms-transition: -ms-transform 2s;
      -o-transition: -o-transform 2s;
      transition: transform 2s;
      -webkit-transform: translateY(0);
      -moz-transform: translateY(0);
      -ms-transform: translateY(0);
      -o-transform: translateY(0);
      transform: translateY(0);
    }

    .odometer.odometer-auto-theme, .odometer.odometer-theme-car {
      -moz-border-radius: 0.34em;
      -webkit-border-radius: 0.34em;
      border-radius: 0.34em;
      //font-family: "Arimo", monospace;
      padding: 0.15em;
      background: rgba(0xbb,0xaa,0x9a, 0.6);
      color: #eee0d3;
    }
    .odometer.odometer-auto-theme .odometer-digit, .odometer.odometer-theme-car .odometer-digit {
      background-size: 100%;
       // color: #000;
      padding: 0 0.15em;
    }
    .odometer.odometer-auto-theme .odometer-digit:first-child, .odometer.odometer-theme-car .odometer-digit:first-child {
      -moz-border-radius: 0.2em 0 0 0.2em;
      -webkit-border-radius: 0.2em;
      border-radius: 0.2em 0 0 0.2em;
    }
    .odometer.odometer-auto-theme .odometer-digit:last-child, .odometer.odometer-theme-car .odometer-digit:last-child {
      -moz-border-radius: 0 0.2em 0.2em 0;
      -webkit-border-radius: 0;
      border-radius: 0 0.2em 0.2em 0;
      // background-image: url('data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4gPHN2ZyB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJncmFkIiBncmFkaWVudFVuaXRzPSJvYmplY3RCb3VuZGluZ0JveCIgeDE9IjAuNSIgeTE9IjAuMCIgeDI9IjAuNSIgeTI9IjEuMCI+PHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iI2VlZTBkMyIvPjxzdG9wIG9mZnNldD0iNDAlIiBzdG9wLWNvbG9yPSIjZWVlMGQzIi8+PHN0b3Agb2Zmc2V0PSI2MCUiIHN0b3AtY29sb3I9IiNiYmFhOWEiLz48c3RvcCBvZmZzZXQ9IjgwJSIgc3RvcC1jb2xvcj0iI2VlZTBkMyIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iI2VlZTBkMyIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JhZCkiIC8+PC9zdmc+IA==');
      background-size: 100%;
      background-image: -webkit-gradient(linear, 50% 0%, 50% 100%, color-stop(0%, #70675d), color-stop(40%, #70675d), color-stop(60%, #bbaa9a), color-stop(80%, #70675d), color-stop(100%, #70675d));
      background-image: -moz-linear-gradient(top, #70675d 0%, #70675d 40%, #bbaa9a 60%, #70675d 80%, #70675d 100%);
      background-image: -webkit-linear-gradient(top, #70675d 0%, #70675d 40%, #bbaa9a 60%, #70675d 80%, #70675d 100%);
      background-image: linear-gradient(to bottom, #70675d 0%, #70675d 40%, #bbaa9a 60%, #70675d 80%, #70675d 100%);
      color: #eee0d3;
    }
    .odometer.odometer-auto-theme .odometer-digit .odometer-digit-inner, .odometer.odometer-theme-car .odometer-digit .odometer-digit-inner {
      left: 0.15em;
    }
    .odometer.odometer-auto-theme.odometer-animating-up .odometer-ribbon-inner, .odometer.odometer-auto-theme.odometer-animating-down.odometer-animating .odometer-ribbon-inner, .odometer.odometer-theme-car.odometer-animating-up .odometer-ribbon-inner, .odometer.odometer-theme-car.odometer-animating-down.odometer-animating .odometer-ribbon-inner {
      -webkit-transition-timing-function: linear;
      -moz-transition-timing-function: linear;
      -ms-transition-timing-function: linear;
      -o-transition-timing-function: linear;
      transition-timing-function: linear;
    }
</style>
