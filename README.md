# lifx-mqtt

only works with cert based auth

env var of

- `DEBUG` boolean
- `LIGHTS` comma separated list of ip addresses
- `MQTT_HOST` mqtt host
- `PREFIX` mqtt prefix

expects a `tls` directory relative to the app root to have

- `./tls/ca.crt`
- `./tls/cert.pem`
- `./tls/private.key`
