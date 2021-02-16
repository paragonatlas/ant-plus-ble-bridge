# Ant+ to BLE Bridge

This little app bridges Ant+ devices to Bluetooth Low Energy so that you can us e.g. an Ant+ heart strap with apps on your Apple TV or iPad. It simply connects to your Ant+ devices and rebroadcasts their data over Bluetooth.

## Supported devices
For now, this app only supports Ant+ heart rate monitors ("heart straps").

## Usage
Use this app by following these steps in this order:
1. Plug in your Ant+ dongle into a free USB port on your computer
2. Put on your heart rate monitor
3. Run this app with `npm start`. Within a few seconds, you should see success messages indicating that the startup was completed in order.

NOTE: If the app doesn't manage to start up both Ant+ and Bluetooth within a few seconds, it will exit. In that case, try starting it up again. Sometimes the Ant+ connection can fail to initialize, but simply starting the app again can resolve that problem.

## Use cases
Once you have this app running, you can use your Ant+ heart rate monitor via this bridge with any apps that support a BLE heart rate monitor, such as FulGaz, Rouvy or Zwift. This is especially useful for platforms that don't have a Mac or Windows app and therefore can't be used with an Ant+ dongle - or simply if you prefer to do your workouts using an Apple TV or iPad.

When you look for heart rate monitors in an app like Fulgaz, Rouvy or Zwift, the bridged device will either show up with the name "ANT+ to BLE Bridge" or the name of the computer that this bridge app is running on (e.g. "John's MacBook Air"). Simply connect it in your app as you would any other BLE sensor.

## Troubleshooting
If the bridged device disconnects for any reason (e.g. this app loses the connection to the Ant+ device, or another app loses its Bluetooth connection to this one), the connection is often re-established automatically. If it isn't, try quitting and restarting this app.