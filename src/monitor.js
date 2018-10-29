'use strict';
const request = require('request-promise');
const EventEmitter = require('events');

function* monitors(endpoints, endpointsData) {

    for (let endpoint of endpoints.values()) {
        yield endpointsData.get(endpoint);
    }
}

class Monitor extends EventEmitter {

    constructor(endpoints) {

        super();

        this.endpointsData = new WeakMap();
        this.endpoints = new Map();

        // TODO: got through initial enpoints
    }

    scheduleEndpointMonitoring(endpoint) {

        const monitor = {
            timer: null
        };

        let delay = 0;
        const now = new Date();
        const interval = endpoint['check_interval'] * 1000;
        if (endpoint.checked) {
            const elapsedTime = now - endpoint.checked;
            delay = elapsedTime < interval ? interval - elapsedTime : 0;
        }

        monitor.timer = setTimeout(() => this.checkEndpoint(endpoint), delay);
        this.endpointsData.set(endpoint, monitor);

        return delay;
    }

    async checkEndpoint(endpoint) {

        const monitoringResult = {
            status_code: 200,
            payload: null,
            timestamp: null
        };

        try {
            const response = await request(endpoint.url, {
                method: 'GET',
                resolveWithFullResponse: true
            });

            endpoint.checked = new Date();
            monitoringResult.status_code = response.statusCode;
            monitoringResult.payload = response.body;
            monitoringResult.timestamp = endpoint.checked;
        } catch (error) {
            console.log(`!W! - ===================== ERROR =====================\n`);
            console.log('!W! - error:', error, Object.keys(error));
        }

        this.emit('monitorResult', monitoringResult, endpoint);
        this.scheduleEndpointMonitoring(endpoint);
    }

    addEndpoint(endpoint) {

        if (this.endpoints.has(endpoint.id)) {
            throw new Error(`Endpoint with id:${endpoint.id} already exists!`);
        }

        this.endpoints.set(endpoint.id, endpoint);
        return this.scheduleEndpointMonitoring(endpoint);
    }

    removeEndpoint(endpointId) {

        const endpoint = this.endpoints.get(endpointId);
        this.endpoints.delete(endpointId);

        const monitor = this.endpointsData.get(endpoint);
        clearTimeout(monitor.timer);
    }

    changeEndpoint(endpointId, { name, check_interval: checkInterval , url } = {}) {

        const endpoint = this.endpoints.get(endpointId);
        if (!endpoint) {
            throw new Error(`Endpoint with id:${endpoint.id} doesn\'t' exist!`);
        }

        endpoint.name = name || endpoint.name;
        endpoint.url = url || endpoint.url;
        endpoint['check_interval'] = checkInterval > 0 ? checkInterval : endpoint['check_interval'];

        // for simplicity, restart even when only name is changed
        const monitor = this.endpointsData.get(endpoint);
        // stop old running monitor
        clearTimeout(monitor.timer);
        // schedule new one
        this.scheduleEndpointMonitoring(endpoint);
    }

    destroy() {

        for (let monitor of monitors(this.endpoints, this.endpointsData)) {
            clearTimeout(monitor.timer);
        }
        this.endpoints = null;
    }
}

module.exports = Monitor;
