const axios = require('axios');
const fs = require('fs');
const path = require('path');

class ModuleRegistrar {
    constructor(serviceUrl, gatewayUrl = 'http://api-gateway:8080') {
        this.serviceUrl = serviceUrl;
        this.gatewayUrl = gatewayUrl;
    }

    async register(manifestPath) {
        try {
            const manifestContent = fs.readFileSync(manifestPath, 'utf8');
            const manifest = JSON.parse(manifestContent);

            console.log(`Registering module: ${manifest.name} (${manifest.version})`);

            const response = await axios.post(`${this.gatewayUrl}/api/v1/modules/register`, {
                manifest,
                url: this.serviceUrl
            });

            console.log(`✅ Module registered successfully: ${response.data.status}`);
            return true;
        } catch (error) {
            console.error('❌ Failed to register module:', error.message);
            if (error.response) {
                console.error('Response:', error.response.data);
            }
            return false;
        }
    }
}

module.exports = ModuleRegistrar;
