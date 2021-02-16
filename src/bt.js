const { DEVICE_NAME } = require('./constants')
process.env['BLENO_DEVICE_NAME'] = DEVICE_NAME // TODO unfortunately doesn't seem to work

const bleno = require('@abandonware/bleno')
const noop = require('lodash/noop')
const toInteger = require('lodash/toInteger')
const appState = require('./appState')
const pause = require('./pause')

const BT_STATES = {
  UNKNOWN: 'unknown',
  RESETTING: 'resetting',
  UNSUPPORTED: 'unsupported',
  UNAUTHORIZED: 'unauthorized',
  POWERED_OFF: 'poweredOff',
  POWERED_ON: 'poweredOn',
}

const eventHandlers = {
  onHrChange: noop
}

let isBtOn = false
let isAdvertising = false

const hrBytes = new Uint8Array([0, 0])

const hrIntToBleHrBuffer = (hrInt) => {
  const safeHrInt = toInteger(hrInt)
  if (safeHrInt < 10) { // presumably the user should be a little more than alive
    return null
  } else {
    const clonedHrBytes = new Uint8Array(hrBytes)
    clonedHrBytes[1] = safeHrInt
    return Buffer.from(clonedHrBytes.buffer)
  }
}

const startHrUpdates = (bleNotifyHrChange) => {
  eventHandlers.onHrChange = ({hr}) => {
    const bleHrBuf = hrIntToBleHrBuffer(hr)
    bleHrBuf && bleNotifyHrChange(bleHrBuf)
  }
}

const stopHrUpdates = () => {
  eventHandlers.onHrChange = noop
}

const createHrService = () => new Promise((resolve, reject) => {
  if(!isBtOn){
    return reject(new Error('BT is not on; will not create HR service'))
  }
  
  if(isAdvertising){
    return reject(new Error('Already created and advertising HR service; will not recreate it'))
  }

  if(!(appState.state === appState.POSSIBLE_STATES.STARTING || appState.state === appState.POSSIBLE_STATES.STARTED)){
    return reject(new Error('App is not in the right state (starting or started) to create HR service; will not create it'))
  }
  
  const hrService = new bleno.PrimaryService({
    uuid: '180D',
    characteristics: [new bleno.Characteristic({
      uuid: '2A37',
      properties: ['notify'],
      secure: ['notify'],
      descriptors: [new bleno.Descriptor({uuid: '2901', value: `${DEVICE_NAME}: HR`})],
      onSubscribe: (maxValueSize, updateValueCallback) => startHrUpdates(updateValueCallback),
      onUnsubscribe: stopHrUpdates,
    })]
  })
  
  bleno.setServices([hrService], (err) => {
    if(err){
      console.error('error while setting HR service', err)
      return reject(err)
    } else {
      console.log('successfully set HR service')

      bleno.startAdvertising(DEVICE_NAME, [hrService.uuid], (err) => {
        if(err){
          console.error('error while starting to advertise HR service', err)
          return reject(err)
        } else {
          isAdvertising = true
          console.log('successfully started advertising HR service')
          return resolve()
        }
      })
    }
  })
})

const startup = (onBtUnavailable = noop) => new Promise((resolve, reject) => {
  bleno.on('stateChange', (state) => {
    if(state !== BT_STATES.POWERED_ON){
      pause(200).then(onBtUnavailable)
      return reject(new Error('bluetooth unavailable'))
    } else {
      isBtOn = true
      return createHrService()
        .then(() => pause(500).then(resolve))
        .catch((err) => {
          console.error('error while creating HR service', err)
          return reject(err)
        })
    }
  })
})

const shutdown = () => new Promise((resolve) => {
  if(!isAdvertising){
    return resolve()
  } else {
    stopHrUpdates()
    bleno.stopAdvertising() // unfortunately the optional callback that can be passed to this method never seems to be called, so as a workaround we pause for 500ms before resolving the promise
    return pause(500).then(resolve)
  }
})

module.exports = {
  startup,
  shutdown,
  eventHandlers,
}