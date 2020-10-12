import { vm } from '@/main'

export default {
  events: {
    id: 'events',
    type: 'symbol',
    source: 'events',
    layout: {
      'icon-image': 'embassy-15',
      'icon-offset': {
        stops: [
          [13, [0, -10]]
        ]
      }
    },
    filter: ['==', 'selected', true]
  },
  getFeatureGeojson(item, position) {
    const geojson = {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: []
      },
      properties: {
        id: item.id,
        description: item.description,
        device: item.title,
        icon: item.image,
        color: item.color ? item.color : '#3232b4',
        timestamp: item.timestamp,
        selected: false
      }
    }

    geojson.geometry.coordinates = [parseFloat(position.longitude), parseFloat(position.latitude)]

    return geojson
  },
  findFeatureById(id) {
    return vm.$static.eventsSource.features.find(e => {
      return e.properties.id === id
    })
  },
  findFeatureSelected() {
    return vm.$static.eventsSource.features.find(e => {
      return e.properties.selected === true
    })
  }

}
