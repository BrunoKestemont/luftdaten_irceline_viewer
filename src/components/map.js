import React, { Component } from 'react'
import { connect } from 'react-redux'
import { setCurrentStation } from '../redux/appState/actions'
import { createMarkerIconSVG, colorToRgba, snapToGrid } from '../utilities/generic_functions'
import { blend_colors } from '../utilities/colorBlender'

class Map extends Component {

  markerLayers = {luftdaten: [], irceline: []}

  constructor (props) {
    super(props)
    this.state = {
      map: null,
      layerGroup: null
    }
    this.showMarkers = this.showMarkers.bind(this)
  }

  componentDidMount () {
    const map = window.L.map('map', {
      center: [50.843, 4.368],
      zoom: 12,
      minZoom: 4,
      // restrict panning and zooming to belgium
      // maxBounds: [
      //   [51.666742, 2.123954],
      //   [49.209022, 6.975232]
      // ],
      scrollWheelZoom: 'center'
    })

    map.addEventListener('click', () => this.props.onChangeCurrentStation(null))
    map.addEventListener('zoomend', () => this.render())

    window.L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
      attribution: 'Map stations &copy; <a href="http://openstreetmap.org">OpenStreetMap</a>',
      maxZoom: 18,
      id: 'mapbox.streets',
      accessToken: 'pk.eyJ1IjoiZGF2aWRzaW5naCIsImEiOiJjamIxenh3eXQyNmduMnFwaWJnNzlycTczIn0.CWe6Ty3qZ-AD17PP6D7vpA'
    }).addTo(map)

    const layerGroup = window.L.layerGroup([]).addTo(map)

    this.setState({
      map: map,
      layerGroup: layerGroup
    })
  }

  showMarkers () {
    this.markerLayers.luftdaten = []
    this.markerLayers.irceline = []

    if (this.state.layerGroup)
      this.state.layerGroup.clearLayers()

    let stations = this.props.stations

    for (let k in stations) {

      let hexagonMarkerOptions = {
        borderColor: '#FFF',
        size: 50,
        content: ''
      }

      const station = stations[k]

      let hasSensorForCurrentPhenomenon = false

      for (let i in station.sensors) {
        const sensor = station.sensors[i]
        const phenomenon = this.props.appState.phenomenon
        if (typeof sensor[phenomenon] !== 'undefined' && sensor[phenomenon] !== null) {
          hasSensorForCurrentPhenomenon = true
          const currentValue = sensor[phenomenon]
          const phenomenonMeta = this.props.appState.phenomenonMeta[phenomenon]
          const valueExceedsIndex = phenomenonMeta.values.indexOf(
            (phenomenonMeta.values.find(
              (value) => {
                return value >= currentValue
              }
            ) || phenomenonMeta.values[phenomenonMeta.values.length - 1]))
          const valueLower = phenomenonMeta.values[valueExceedsIndex - 1]
          const valueUpper = phenomenonMeta.values[valueExceedsIndex] - valueLower
          const valuePercent = (currentValue - valueLower) / valueUpper
          const colorLower = phenomenonMeta.colors[valueExceedsIndex - 1]
          const colorUpper = phenomenonMeta.colors[valueExceedsIndex]

          const colorBlend = blend_colors(colorLower, colorUpper, valuePercent)
          hexagonMarkerOptions.color = colorToRgba(colorBlend, 0.4)

          break
        }
      }

      //selected border
      if (this.props.appState.station && this.props.appState.station.id === station.id) {
        hexagonMarkerOptions.borderColor = '#000'
      }

      let markerOptions = {
        icon:
          window.L.divIcon({
            className: 'hexagonMarker',
            html: createMarkerIconSVG(hexagonMarkerOptions)
            // iconAnchor: [0-hexagonMarkerOptions.size/2, 0-hexagonMarkerOptions.size/2]
          })
      }

      //add markers to layergroup
      if (hasSensorForCurrentPhenomenon) {

        //TODO implement hexgrid
        const latlngSnappedToGrid = snapToGrid([station.latitude, station.longitude], this.state.map, hexagonMarkerOptions.size)
        const latlng = [station.latitude, station.longitude]
        const marker = window.L.marker(latlngSnappedToGrid, markerOptions)
          .addEventListener('click',
            () => {
              this.props.onChangeCurrentStation(station)

              //center zoom on marker
              const latLng = marker.getLatLng()
              const zoom = this.state.map.getZoom()
              this.state.map.setView(latLng, zoom)
            }
          )

        this.markerLayers[station.origin].push(marker)
      }
    }

    if (this.props.dataOrigin.luftdaten) {
      this.markerLayers.luftdaten.forEach(
        (marker) => {
          marker.addTo(this.state.layerGroup)
        }
      )
    }

    if (this.props.dataOrigin.irceline) {
      this.markerLayers.irceline.forEach(
        (marker) => {
          marker.addTo(this.state.layerGroup)
        }
      )
    }

  }

  render () {
    this.showMarkers()
    return (
      <div id="map"/>
    )
  }
}

const mapStateToProps = state => {
  return {
    appState: state.appState,
    stations: state.stations,
    dataOrigin: state.appState.dataOrigin
  }
}

const mapDispatchToProps = dispatch => {
  return {
    onChangeCurrentStation: sensor => {
      dispatch(setCurrentStation(sensor))
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Map)