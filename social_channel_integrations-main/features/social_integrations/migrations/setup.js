'use strict';

/* eslint-disable no-unused-vars */

const { createKey } = require('../utils/featureHelpers');

module.exports = {
    onBootstrap: async function ({ env, logger, helpers }) {
        logger.debug('onBootstrap');
    },

    beforeAll: async function ({ env, logger, helpers, vars }, migrationsToRun, willApply) {
        logger.debug('beforeAll');

        // initialize /clean vars
        const varsToClean = ['socialChannel', 'deployOption', 'omsOption'];
        const booleanVarsToUpdate = ['includeOCI', 'includePixel'];
        for (let i = 0; i < varsToClean.length; i++) {
            let varToClean = varsToClean[i];
            if (Object.hasOwnProperty.call(vars, varToClean) && vars[varToClean]) {
                vars[varToClean] = createKey(vars[varToClean]);
            }
        }
        for (let i = 0; i < booleanVarsToUpdate.length; i++) {
            let booleanVarToUpdate = booleanVarsToUpdate[i];
            if (Object.hasOwnProperty.call(vars, booleanVarToUpdate) && vars[booleanVarToUpdate]) {
                vars[booleanVarToUpdate] = vars[booleanVarToUpdate] === true || vars[booleanVarToUpdate] === 'true';
            }
        }

        if (!vars.siteConfigs) {
            vars.siteConfigs = {};
        }
        if (vars.siteId) {
            vars.siteConfigs[vars.siteId] = {
                socialChannel: vars.socialChannel,
                deployOption: vars.deployOption,
                omsOption: vars.omsOption,
                includeOCI: vars.includeOCI,
                includePixel: vars.includePixel
            };
        }

        if (!vars.appliedSites) {
            vars.appliedSites = [];
        }

        if (!vars.appliedSites.includes(vars.siteId)) {
            vars.appliedSites.push(vars.siteId);
        }

        if (vars.ocapiClientId === 'skip') {
            delete vars.ocapiClientId;
        }

        if (vars.scapiClientId === 'skip') {
            delete vars.scapiClientId;
            delete vars.scapiClientSecret;
        }

        if (vars.shortCode && !env.shortCode) {
            env.shortCode = vars.shortCode;
        }
    },

    beforeEach: async function ({ env, logger, helpers }, migration, willApply) {
        logger.debug('beforeEach');
    },

    onFailure: async function ({ env, logger, helpers }, migration, exc) {
        throw exc;
    },

    afterEach: async function ({ env, logger, helpers }, migration, applied) {
        logger.debug('afterEach');
    },

    afterAll: async function (args) {
        const { vars, logger } = args;
        logger.debug('afterAll');

        // run the social integration setup script
        await require('./_socialSetup')(args);
    }
};
