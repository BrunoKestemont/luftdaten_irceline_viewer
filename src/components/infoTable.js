import React from 'react'
import { connect } from 'react-redux'
import { setCurrentSensor, setID } from '../redux/appState/actions'

const InfoTable = props => {
  if (props.data.length === 0) return null

  let sumCol1 = 0
  let countCol1 = 0
  let sumCol2 = 0
  let countCol2 = 0
  let sumCol3 = 0
  let countCol3 = 0

  const sensorList = props.data.map(
    sensor => {
      //TODO Keep or not?
      if (props.origin[sensor.origin] === false) return null

      let col1Value, col1Unit, col2Value, col2Unit, col3Value, col3Unit
      if (sensor.PM10 || sensor.PM25) {
        col1Value = sensor.PM10
        col1Unit = <span>&nbsp;µg/m<sup>3</sup></span>
        col2Value = sensor.PM25
        col2Unit = <span>&nbsp;µg/m<sup>3</sup></span>
      } else if (sensor.temperature || sensor.humidity || sensor.pressure) {
        col1Value = sensor.temperature
        col1Unit = <span>&nbsp;°C</span>
        col2Value = sensor.humidity
        col2Unit = <span>&nbsp;&#37;</span>
        col3Value = sensor.pressure
        col3Unit = <span>&nbsp;hPa</span>
      }

      if (col1Value) {
        sumCol1 += parseFloat(col1Value)
        countCol1++
        col1Value = <span>{col1Value}{col1Unit}</span>
      } else {
        col1Value = '-'
      }

      if (col2Value) {
        sumCol2 += parseFloat(col2Value)
        countCol2++
        col2Value = <span>{col2Value}{col2Unit}</span>
      } else {
        col2Value = '-'
      }

      if (col3Value) {
        sumCol3 += parseFloat(col3Value)
        countCol3++
        col3Value = parseFloat(col3Value)
        col3Value = col3Value.toFixed(2)
        col3Value = <span>{col3Value}{col3Unit}</span>
      } else {
        col3Value = '-'
      }

      return (
        <React.Fragment key={sensor.id}>
          <tr className={
            (props.sensor === sensor.id) ? 'sensor selected' : 'sensor'
          } onClick={() => props.onChangeCurrentSensor(sensor.id)}>
            <td>
              <span className='a' onClick={() => { props.onSetID(sensor.id) }}>{sensor.id}</span>
            </td>
            <td>{col1Value}</td>
            <td>{col2Value}</td>
            {
              (props.type === 'tempAndHum') ? <React.Fragment>
                <td>{col3Value}</td>
              </React.Fragment> : null
            }
          </tr>
          {
            (props.sensor === sensor.id) ? <React.Fragment>
              <tr className='selected'>
                <td>Station ID</td>
                <td colSpan='3'>{sensor.stationID}</td>
              </tr>
              <tr className='selected'>
                <td>Name</td>
                <td colSpan='3'>{sensor.name}</td>
              </tr>
              <tr className='selected'>
                <td>Source</td>
                <td colSpan='3'><a target='_blank'
                                   href={(sensor.origin === 'irceline') ? 'http://www.irceline.be/' : (sensor.origin === 'luftdaten') ? 'http://luftdaten.info/' : ''}>{sensor.origin}</a>
                </td>
              </tr>
              <tr className='selected'>
                <td>Location</td>
                <td colSpan='3'>
                  <span>lat: {sensor.lat},<br/> long: {sensor.lng},<br/> alt: {sensor.alt}</span>
                </td>
              </tr>
            </React.Fragment> : null
          }

        </React.Fragment>
      )
    }
  )

  let meanCol1 = (sumCol1 / countCol1).toFixed(2)
  if (isNaN(meanCol1)) meanCol1 = '-'
  let meanCol2 = (sumCol2 / countCol2).toFixed(2)
  if (isNaN(meanCol2)) meanCol2 = '-'
  let meanCol3 = (sumCol3 / countCol3).toFixed(2)
  if (isNaN(meanCol3)) meanCol3 = '-'

  // TODO shorten

  if (props.type === 'partsPerMillion') {
    return (
      <table>
        <tbody>
        <tr className='headers'>
          <th>Sensor&nbsp;ID</th>
          <th style={{textDecoration: props.phenomenon === 'PM10' ? 'underline' : 'none'}}>PM10</th>
          <th style={{textDecoration: props.phenomenon === 'PM25' ? 'underline' : 'none'}}>PM2.5</th>
        </tr>
        {
          (countCol1 <= 1 && countCol2 <= 1) ? null : (
            <tr className='mean'>
              <th>Mean</th>
              <td>{meanCol1}&nbsp;µg/m<sup>3</sup></td>
              <td>{meanCol2}&nbsp;µg/m<sup>3</sup></td>
            </tr>
          )
        }
        {sensorList}
        </tbody>
      </table>
    )
  }
  if (props.type === 'tempAndHum') {
    return (
      <table>
        <tbody>
        <tr className='headers'>
          <th>Sensor&nbsp;ID</th>
          <th style={{textDecoration: props.phenomenon === 'temperature' ? 'underline' : 'none'}}>Temp.</th>
          <th style={{textDecoration: props.phenomenon === 'humidity' ? 'underline' : 'none'}}>Hum.</th>
          <th style={{textDecoration: props.phenomenon === 'pressure' ? 'underline' : 'none'}}>Pres.</th>
        </tr>
        {
          (countCol1 <= 1 && countCol2 <= 1 && countCol3 <= 1) ? null : (
            <tr className='mean'>
              <th>Mean</th>
              <td>{meanCol1}&nbsp;°C</td>
              <td>{meanCol2}&nbsp;&#37;</td>
              <td>{meanCol3}&nbsp;hPa</td>
            </tr>
          )
        }
        {sensorList}
        </tbody>
      </table>
    )
  }
}

const mapStateToProps = state => {
  return {
    phenomenon: state.appState.phenomenon,
    sensor: state.appState.sensor,
    origin: state.appState.dataOrigin
  }
}

const mapDispatchToProps = dispatch => {
  return {
    onChangeCurrentSensor: sensor => {
      dispatch(setCurrentSensor(sensor))
    },
    //TODO remove if unecessary
    // onSetMapCoords: coords => {
    //   dispatch(setMapCoords(coords))
    // },
    onSetID: id => {
      dispatch(setID(id))
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(InfoTable)
