const moment = require('moment')
const noop = require('lodash/noop')
const Ant = require('gd-ant-plus')
const pause = require('./pause')
const { DEBUG } = require('./constants')

let stick = null
let stickIsOpen = false

let hrSensor = null
let hrSensorIsAttached = false

const startup = (hrDataCallback = noop) => new Promise((resolve, reject) => {
  stick = new Ant.GarminStick3()
  hrSensor = new Ant.HeartRateSensor(stick)

  hrSensor.on('attached', function () { // TODO this is called even when there's no sensor present; figure out a way to detect whether there actually is an Ant+ HR sensor around or not
    console.log('hrSensor attached')
    hrSensorIsAttached = true
    return pause(500).then(resolve)
  })

  hrSensor.on('detached', function () {
    console.log('hrSensor detached')
  })
  
  hrSensor.on('hbData', function (data) {
    const dev = data.DeviceID
    const hr = data.ComputedHeartRate
    const ts = moment().format('x')

    DEBUG && console.log(`hr: ${hr};  \tts: ${ts};\tdevice: ${dev}`)

    hrDataCallback({ts, hr})
  })
  
  stick.on('startup', function () {
    stickIsOpen = true
    hrSensor.attach(0, 0)
  })
  
  stick.on('shutdown', function () {
    console.log('Stick closed')
  })

  if (!stick.is_present()) {
    return reject(new Error('Cannot find stick'))
  }
  
  if (!stick.open()) {
    return reject(new Error('Cannot open stick'))
  }
})

const shutdown = async () => {
  if(hrSensorIsAttached){
    try{
      hrSensor.detach()
      await pause(1000)
    } catch (err) {
      console.error('Error while detaching hrSensor', err)
    }
  }
  
  if(stickIsOpen){
    try{
      stick.close()
      await pause(1000)
    } catch (err) {
      console.error('Error while closing stick', err)
    }
  }
}

module.exports = {
  startup,
  shutdown,
}