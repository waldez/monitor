# monitor

## Prerequisites

 * node.js
 * npm or yarn
 * docker and docker-compose

## Installation

```sh
docker-compose -p monitor up -d
npm i
```

## Run

```sh
npm start
```

## Tests

```sh
npm test
```

## Additional info
Create Batman & Applifting user
```sh
npm start fakeUsers
```
Clear database tables
```sh
npm start clearDb
```

Server is configured via ENV variables.
Start at port 80:
```sh
SERVER_PORT=80 npm start
```
Default HTTP server port is 8888.

## Examples

```sh
#!/bin/bash

# DISCLAIMER!
# This example will run only when the database is fresh and there is user Batman.
# Also server needs to be started with defaults (npm start)

BATMANS_ACCESS_TOKEN=dcb20f8a-5657-4f1b-9f7f-ce65739b359e

# Create endpoint
curl --header "Content-Type: application/json" \
  --request POST \
  -H "Authorization: Bearer ${BATMANS_ACCESS_TOKEN}" \
  --data '{"name":"Countdown","url":"http://www.zemancountdown.cz/","check_interval":25}' \
  http://localhost:8888/MonitoredEndpoint

echo ""

# Read endpoint
curl --header "Content-Type: application/json" \
  --request GET \
  -H "Authorization: Bearer ${BATMANS_ACCESS_TOKEN}" \
  http://localhost:8888/MonitoredEndpoint/1

echo ""

# List endpoints
curl --header "Content-Type: application/json" \
  --request GET \
  -H "Authorization: Bearer ${BATMANS_ACCESS_TOKEN}" \
  http://localhost:8888/MonitoredEndpoints

echo ""

# Update endpoint
curl --header "Content-Type: application/json" \
  --request PUT \
  -H "Authorization: Bearer ${BATMANS_ACCESS_TOKEN}" \
  --data '{"name":"Zeman countdown"}' \
  http://localhost:8888/MonitoredEndpoint/1

echo ""

# wait 5 seconds
sleep 5

# List results
curl --header "Content-Type: application/json" \
  --request GET \
  -H "Authorization: Bearer ${BATMANS_ACCESS_TOKEN}" \
  http://localhost:8888/MonitoringResults/1

echo ""

# Remove endpoint
curl --header "Content-Type: application/json" \
  --request DELETE \
  -H "Authorization: Bearer ${BATMANS_ACCESS_TOKEN}" \
  http://localhost:8888/MonitoredEndpoint/1

echo ""

```
