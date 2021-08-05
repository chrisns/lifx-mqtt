const Lifx = require('node-lifx').Client
const lifxClient = new Lifx()
const mqtt = require('mqtt')
const fs = require('fs')
const prefix = process.env.PREFIX || "lifx"

const opts = {
  protocol: 'mqtts',
  host: process.env.MQTT_HOST,
  port: 8883,
  ca: fs.readFileSync('./tls/ca.crt'),
  cert: fs.readFileSync('./tls/cert.pem'),
  key: fs.readFileSync('./tls/private.key'),
}

const client = mqtt.connect(opts)

client.on('connect', () => {
  console.log("MQTT connection established")
  client.subscribe(`${prefix}/set/#`)
  lifxClient.init({
    lights: process.env.LIGHTS.split(",") || [],
    debug: process.env.DEBUG ? true : false
  })
})

client.on('message', (topic, message) => {
  const targetLight = lifxClient.findByLabel(topic.split("/").pop())

  if (targetLight == null) return

  const changeBrightness = (light, currentState, change) => {
    const brightness = currentState.color.brightness + change
    if (brightness > 100) brightness = 100
    if (brightness < 0)
      light.off()
    else {
      light.color(currentState.color.hue, currentState.color.saturation, brightness, currentState.color.kelvin)
      if (currentState.power == 0) light.on()
    }
  }

  const changeColor = (light, currentState, hue, saturation, brightness, kelvin) => {
    light.color(hue, saturation, currentState.color.brightness, brightness ? brightness : 100, kelvin ? kelvin : 3500)
    if (currentState.power == 0) light.on()
  }

  const changeWarmth = (light, currentState, change) => {
    const kelvin = currentState.color.kelvin + change
    if (kelvin > 9000) kelvin = 9000
    if (kelvin < 2500) kelvin = 2500
    light.color(currentState.color.hue, currentState.color.saturation, currentState.color.brightness, kelvin)
  }

  targetLight.getState((err, state) => {
    switch (message.toString()) {
      case "on":
        targetLight.on()
        break
      case "off":
        targetLight.off()
        break
      case "white":
        changeColor(targetLight, state, 0, 0)
        break
      case "red":
        changeColor(targetLight, state, 0, 100)
        break
      case "green":
        changeColor(targetLight, state, 142, 100, 65)
        break
      case "blue":
        changeColor(targetLight, state, 240, 100)
        break
      case "orange":
        changeColor(targetLight, state, 45, 100, 65, 3500)
        break
      case "purple":
        changeColor(targetLight, state, 300, 100, 67)
        break
      case "dimmer":
        changeBrightness(targetLight, state, -10)
        break
      case "muchdimmer":
        changeBrightness(targetLight, state, -25)
        break
      case "brighter":
        changeBrightness(targetLight, state, 10)
        break
      case "muchbrighter":
        changeBrightness(targetLight, state, 25)
        break
      case "warmer":
        changeWarmth(targetLight, state, 1300)
        break
      case "cooler":
        changeWarmth(targetLight, state, -1300)
        break
    }
  })
})

client.on('close', () => {
  console.error("Client disconnected")
  process.exit(1)
})

client.on('error', err => {
  console.error("Error occurred", err)
  process.exit(1)
})

lifxClient.on('error', err => {
  console.error(`LIFX error:\n${err.stack}`)
  lifxClient.destroy()
  client.end()
  process.exit(1)
})

lifxClient.on('light-new', async light =>
  light.getLabel((err, label) => {
    client.publish(`${prefix}/newLight/${light.label}`, 'discovered')
    client.publish(`${prefix}/lightStatus/${light.label}`, 'online')
  })
)

lifxClient.on('light-online', light =>
  client.publish(`${prefix}/lightStatus/${light.label}`, 'online')
)

lifxClient.on('light-offline', light =>
  client.publish(`${prefix}/lightStatus/${light.label}`, 'offline')
)

lifxClient.on('listening', () => {
  const address = lifxClient.address()
  console.log(
    'Started LIFX listening on ' +
    address.address + ':' + address.port + '\n'
  )
})

lifxClient.findByLabel = label => {
  const foundBulb = null
  lifxClient.lights().some(light => {
    if (light.label == label) {
      foundBulb = light
      return true
    }
  })

  return foundBulb
}
