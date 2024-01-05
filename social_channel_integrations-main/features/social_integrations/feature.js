'use strict';

const {
    createKey,
    createListOption,
    getCartridgeListFromConstant,
    removeFromCartridgePath,
    removeScapiClient
} = require('./utils/featureHelpers');
const {
    BIZ_MNGR_SITE_ID,
    DATA_API_RESOURCES
} = require('./utils/socialConstants');

/**
 * Updates OCAPI client ID permissions
 * @param {Object} args arguments
 * @param {Environment} args.env environment
 * @param {Logger} args.logger logger
 * @param {MigrationHelpers} args.helpers helpers
 * @returns {Promise<void>} void
 */
async function ensureDataPermissions({ env, logger, helpers }) {
    try {
        const { ensureDataAPIPermissions } = helpers;

        // ensure we have access to additional data API resources for sites and cartridge updates
        await ensureDataAPIPermissions(env, DATA_API_RESOURCES.B2C_TOOLS, async () => {
            var sites = await env.ocapi.get('sites');
            if (sites.data.count === 0) {
                return true;
            }
            var firstSiteID = sites.data.data[0].id;
            await env.ocapi.get(`sites/${firstSiteID}`);
            await env.ocapi.post(`sites/${firstSiteID}/cartridges`, {
                name: 'test_cartridge',
                position: 'last'
            });
            await env.ocapi.delete(`sites/${firstSiteID}/cartridges/test_cartridge`);
            return true;
        });
    } catch (e) {
        logger.debug(e.message);
        logger.warn('Unable to update data permissions');
    }
}

const QUESTIONS = ({ siteIds, defaultSite }) => {
    return [
        {
            name: 'siteId',
            message: 'Which site?',
            type: 'list',
            choices: siteIds,
            default: defaultSite
        },
        {
            name: 'socialChannel',
            message: 'Social Channel',
            type: 'list',
            choices: [
                createListOption('All Channels'),
                createListOption('Google'),
                createListOption('Instagram'),
                createListOption('Snapchat'),
                createListOption('TikTok Ads'),
                createListOption('TikTok Shop'),
                createListOption('TikTok Ads and Shop')
            ],
            default: createKey('All Channels')
        },
        {
            name: 'ocapiClientId',
            message: 'Social Integrations OCAPI Client ID (used only for social integrations; if left blank no updates will be made)',
            type: 'string',
            default: 'skip'
        },
        {
            name: 'scapiClientId',
            message: 'Social Integrations SLAS Private Client ID? (Enter "create" if you want a SLAS private client created for you; we will attempt to create a client if one is required for your social channel.)',
            type: 'string',
            default: 'skip'
        },
        {
            name: 'scapiClientSecret',
            message: 'Social Integrations SLAS Client Secret',
            type: 'password',
            mask: '*'
        },
        {
            name: 'shortCode',
            message: 'SCAPI Short Code? (e.g.: kv7kzm78)',
            type: 'string'
        },
        {
            name: 'orgId',
            message: 'SCAPI Org ID? (e.g.: f_ecom_zzte_053)',
            type: 'string'
        },
        {
            name: 'deployOption',
            message: 'Deploy Option',
            type: 'list',
            choices: [
                createListOption('Code and Data'),
                createListOption('Code Only'),
                createListOption('Data Only')
            ],
            default: createKey('Code and Data')
        },
        {
            name: 'omsOption',
            message: 'OMS Integration',
            type: 'list',
            choices: [
                createListOption('None'),
                createListOption('Salesforce OMS'),
                createListOption('Other OMS')
            ],
            default: createKey('None')
        },
        {
            name: 'includeOCI',
            message: 'Include Omnichannel Inventory?',
            type: 'list',
            choices: [
                {
                    name: 'No',
                    value: false
                },
                {
                    name: 'Yes',
                    value: true
                }],
            default: false
        },
        {
            name: 'includePixel',
            message: 'Include Pixel Tracking Cartridges?',
            type: 'list',
            choices: [{
                name: 'No',
                value: false
            },
            {
                name: 'Yes',
                value: true
            }],
            default: false
        }
    ];
};

/**
 * Set default vars while in non-interactive mode (CI)
 * @param {Object} args - args
 * @param {Object} args.vars - vars
 * @param {string} defaultSite - default site
 * @param {Array} questions - questions
 * @private
 */
const setDefaultVars = ({ vars }, defaultSite, questions) => {
    if (!vars.siteId && defaultSite) {
        vars.siteId = defaultSite;
    }
    const siteConfig = vars.siteConfigs
        && Object.hasOwnProperty.call(vars.siteConfigs, vars.siteId)
        && vars.siteConfigs[vars.siteId] ? vars.siteConfigs[vars.siteId] : {};

    // loop through the questions and set defaults
    for (let i = 0; i < questions.length; i++) {
        let question = questions[i];
        if (!Object.hasOwnProperty.call(vars, question.name) || vars[question.name] == null) {
            vars[question.name] = Object.hasOwnProperty.call(siteConfig, question.name)
            && siteConfig[question.name] != null
                ? siteConfig[question.name] : question.default;
        }
    }
};

module.exports = {
    featureName: 'Social Integrations',
    secretVars: ['scapiClientSecret'],

    /**
     *
     * @param {Environment} env
     * @param logger
     * @param helpers
     * @param vars
     * @returns {*[]}
     */
    // eslint-disable-next-line no-unused-vars
    questions: async function ({ env, logger, helpers, vars }) {
        // ensure base data OCAPI permissions
        await ensureDataPermissions({ env, logger, helpers, vars });

        // init short code
        if (!vars.shortCode) {
            if (process.env.SFCC_SHORT_CODE) {
                vars.shortCode = process.env.SFCC_SHORT_CODE;
            } else if (env.shortCode) {
                vars.shortCode = env.shortCode;
            }
        }

        // init org ID
        if (!vars.orgId) {
            if (process.env.SFCC_ORGANIZATION_ID) {
                vars.orgId = process.env.SFCC_ORGANIZATION_ID;
            } else if (env.server && env.server.includes('dx.commercecloud')) {
                // derive it from hostname for sandboxes
                vars.orgId = 'f_ecom_' + env.server.split('.').shift().replace('-', '_');
            }
        }

        // set list of sites
        let sites = await env.ocapi.get('sites');
        let siteIds = sites.data.data.map(s => s.id);
        let defaultSite = siteIds && siteIds.length ? siteIds[0] : null;

        // if the job has run at least once, use different defaults
        if (vars.appliedSites) {
            defaultSite = vars.appliedSites[vars.appliedSites.length - 1];
        }

        const questions = QUESTIONS({ siteIds, defaultSite });

        // ensure vars are set in non-interactive mode (CI)
        // so the questions do not throw an exception and fail the run
        if (!process.stdin.isTTY) {
            setDefaultVars({ vars }, defaultSite, questions);
        }

        return questions;
    },

    excludeMigrations: [
        '^_.*'
    ],

    /**
     * (Optional) Will remove the feature from the instance
     *
     * @param {Environment} env
     * @param logger
     * @param helpers
     * @param vars
     */
    // eslint-disable-next-line no-unused-vars
    remove: async function ({ env, logger, helpers, vars }) {
        /* eslint-disable no-await-in-loop */
        try {
            if (vars.shortCode && !env.shortCode) {
                env.shortCode = vars.shortCode;
            }

            // ***********
            // remove cartridges from cartridge path
            // ***********
            const cartridgesToRemove = getCartridgeListFromConstant();
            let siteIds = vars.appliedSites || [];
            if (!siteIds.length) {
                const sites = await env.ocapi.get('sites');
                siteIds = sites.data.data.map(s => s.id);
            }
            // add business manager site
            siteIds.push(BIZ_MNGR_SITE_ID);
            await removeFromCartridgePath({ env, logger, helpers }, cartridgesToRemove, siteIds);

            // ***********
            // remove commerce API client ID
            // ***********
            await removeScapiClient({ env, logger, vars });
        } catch (e) {
            throw new Error(`Unable to remove feature: ${e.message}`);
        }
    },

    /**
     * cleanup tasks. This feature lifecycle function is called right before the state is updated on the instance
     * @param {Object} vars variables
     */
    finish: async function ({ vars }) {
        // delete vars so that they do not default on subsequent runs
        delete vars.siteId;
        delete vars.socialChannel;
        delete vars.socialChannelBase;
        delete vars.deployOption;
        delete vars.omsOption;
        delete vars.includeOCI;
        delete vars.includePixel;
        delete vars.updatedSiteDirectories;
        if (!vars.ocapiClientId || vars.ocapiClientId === 'skip') {
            delete vars.ocapiClientId;
        }
        if (!vars.scapiClientId || vars.scapiClientId === 'skip' || vars.scapiClientId === 'create') {
            delete vars.scapiClientId;
            delete vars.scapiClientSecret;
        }
        if (!vars.scapiClientSecret) {
            delete vars.scapiClientSecret;
        }
        if (!vars.orgId) {
            delete vars.orgId;
        }
    }
};
