'use strict';

const shell = require('shelljs');
const path = require('path');

const getConfig = () => {
    let dwJson = {};
    try {
        try {
            // try to load env vars from .env
            require('dotenv').config({ override: true });
        } catch (e) { /* ignore not having dotenv */ }

        const dwJsonPath = process.env.SFCC_CONFIG || path.resolve(__dirname, '../../dw.json');
        const instanceName = process.env.SFCC_INSTANCE;
        dwJson = require(path.resolve(dwJsonPath));
        // if we have an array and the main config is not active (or has no active property)
        if (!instanceName || dwJson.name !== instanceName) {
            if (instanceName && Array.isArray(dwJson.configs)) {
                dwJson = dwJson.configs.find((v) => v.name === instanceName) || dwJson;
            } else if (Array.isArray(dwJson.configs) && dwJson.active !== true) {
                dwJson = dwJson.configs.find((v) => v.active === true) || dwJson;
            }
        }
    } catch (e) {
        /* ignore */
    }
    return dwJson;
};

const config = getConfig();
if (config && config.hostname) {
    console.info(`Setting the default Commerce Cloud instance to: ${config.hostname}`);
    shell.exec(`sfcc-ci instance:add ${config.hostname} ${config.hostname.substring(0, config.hostname.indexOf('.'))}`);
    shell.exec(`sfcc-ci instance:set ${config.hostname}`);
} else {
    console.error('no dw.json file found!');
}
