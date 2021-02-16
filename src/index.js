const each = require('lodash/each')
const once = require('lodash/once')
const appState = require('./appState')
const ant = require('./ant')
const bt = require('./bt')
const pause = require('./pause')
const timeout = pause

const SIGNALS = ['SIGINT', 'SIGTERM', 'SIGHUP']

const shutdown = async (signal) => {
  try{
    console.log(`\nCaught ${signal}; shutting down...`)
    appState.state = appState.POSSIBLE_STATES.SHUTTING_DOWN
    await pause(1000)
    await bt.shutdown()
    await ant.shutdown()
    console.log(`Caught ${signal}; shutting down... [done]`)
    process.exit(0)
  } catch (err) {
    console.error(err)
    console.log(`Caught ${signal}; shutting down... [fail]`)
    process.exit(1)
  }
}

const shutdownOnce = once(shutdown)

const startup = async () => {
  try{
    appState.state = appState.POSSIBLE_STATES.STARTING
    console.log(`Starting up...`)

    await Promise.race([bt.startup(() => shutdownOnce('BT_UNAVAILABLE')), timeout(2000, new Error('BT startup timed out'))])
    await Promise.race([ant.startup((hrData) => bt.eventHandlers.onHrChange(hrData)), timeout(2000, new Error('Ant+ startup timed out'))])

    appState.state = appState.POSSIBLE_STATES.STARTED
    console.log(`Starting up... [done]`)
  } catch (err) {
    console.error(err)
    console.log(`Starting up... [fail]`)
    await shutdownOnce('STARTUP_FAIL')
  }
}

each(SIGNALS, (signal) => process.on(signal, () => shutdownOnce(signal)))

startup()