'use strict';

const crypto = require('crypto');
const fs = require('fs');
const glob = require('glob');
const path = require('path');

const {
    BIZ_MNGR_SITE_ID,
    CARTRIDGES,
    CARTRIDGE_PATHS,
    DATA_API_RESOURCES,
    DIRECTORIES,
    OCAPI_VERSION,
    SCAPI_CLIENT_NAME,
    SCAPI_CLIENT_REQUIRED,
    SCAPI_SCOPES,
    SOCIAL_CHANNELS,
    SHOP_API_RESOURCES,
    SHOP_API_RESOURCES_SCAPI,
    WEBDAV_PERMISSIONS
} = require('../utils/socialConstants');

/**
 * Create a key for the GitHub action friendly name
 * @param {string} str - the GitHub actions friendly name
 * @returns {string} derived key from friendly name
 */
const createKey = (str) => {
    return str
        .replace(/[^\w\s]/gi, '') // Remove special characters
        .replace(/\s+and\s+/gi, '_') // Replace ' and ' with an underscore
        .replace(/\s+/g, '_') // Replace remaining spaces with underscores
        .toUpperCase();
};

/**
 * Create a list option for the feature questions using same key as GitHub actions will use
 * @param {string} optionName - the option friendly name
 * @returns {Object} list option
 */
const createListOption = (optionName) => {
    return {
        name: optionName,
        value: createKey(optionName)
    };
};

/**
 * attempt to set the instance type
 * @param {Environment} env environment
 * @returns {string} instance type
 */
const getInstanceType = (env) => {
    if (!env || !env.server) return 'sandbox';
    if (env.server.includes('dx.commercecloud')) {
        return 'sandbox';
    }
    if (env.server.includes('staging')) {
        return 'staging';
    }
    if (env.server.includes('development')) {
        return 'development';
    }
    if (env.server.includes('production')) {
        return 'production';
    }
    return 'sandbox';
};

const getCartridgeDirPath = (f, dir) => path.resolve(dir, path.dirname(f));
const getCartridgeName = (dirName) => path.basename(dirName);

/**
 * Find matching cartridges in the current project.
 * @param {string} directory - the current project directory
 * @param {string[]} cartridgesToInclude - the list of cartridges to include
 * @returns {string[]} list of cartridge names
 */
const findCartridges = (directory, cartridgesToInclude) => {
    const projectFiles = glob.sync('.project', {
        matchBase: true,
        ignore: '**/node_modules/**',
        cwd: directory
    });
    return projectFiles.filter((f) => {
        let cartridge = getCartridgeName(getCartridgeDirPath(f, directory));
        return cartridgesToInclude.includes(cartridge);
    }).map((f) => {
        let cartridgeDirName = getCartridgeDirPath(f, directory);
        return {
            dest: getCartridgeName(cartridgeDirName),
            src: cartridgeDirName
        };
    });
};

/**
 * Get the OMS cartridge to use for a given OMS option.
 * @param {string} omsOption - the OMS option
 * @returns {Array|null} the OMS cartridges
 */
const getOMSCartridges = (omsOption) => {
    switch (omsOption) {
        case 'SALESFORCE_OMS':
            return CARTRIDGES.OMS_SOM;
        case 'OTHER_OMS':
            return CARTRIDGES.OMS_OTHER;
        default:
            return null;
    }
};

/**
 * Get the pixel tracking cartridges to use
 * @param {Object} vars - the variables object
 * @param {string} vars.socialChannel - the social channel (TIKTOK_ADS_SHOP)
 * @param {string} vars.socialChannelBase - the social channel (TIKTOK)
 * @returns {string[]} the pixels cartridges
 */
const getPixelCartridges = (vars) => {
    let pixelCartridges = [];
    if (vars.socialChannel === SOCIAL_CHANNELS.ALL_CHANNELS) {
        Object.keys(CARTRIDGES.PIXEL).forEach((key) => {
            if (key !== 'ALL') {
                pixelCartridges = [...pixelCartridges, ...CARTRIDGES.PIXEL[key]];
            }
        });
    } else if (Object.hasOwnProperty.call(CARTRIDGES.PIXEL, vars.socialChannelBase) && CARTRIDGES.PIXEL[vars.socialChannelBase]) {
        pixelCartridges = [...pixelCartridges, ...CARTRIDGES.PIXEL[vars.socialChannelBase]];
    }
    return [...CARTRIDGES.PIXEL.ALL, ...pixelCartridges];
};

/**
 * Get the list of cartridges to include for a given social channel.
 * @param {Object} args arguments
 * @param {Object} args.vars variables object
 * @param {string} vars.socialChannel - the social channel
 * @param {string} vars.omsOption - the OMS option
 * @returns {Object} list of cartridge names and directory path
 */
const gatherCartridgeDetails = ({ vars }) => {
    const bizMngrCartridges = CARTRIDGE_PATHS.BIZ_MNGR;
    let storefrontCartridges = CARTRIDGE_PATHS.ALL_CHANNELS;

    if (Object.hasOwnProperty.call(CARTRIDGE_PATHS, vars.socialChannel) && CARTRIDGE_PATHS[vars.socialChannel].length) {
        storefrontCartridges = CARTRIDGE_PATHS[vars.socialChannel];
    }

    if (!storefrontCartridges.length) {
        throw new Error('There was a problem creating the list of cartridges to upload');
    }

    // append OMS cartridge, if selected
    const omsCartridges = getOMSCartridges(vars.omsOption);
    if (omsCartridges && omsCartridges.length) {
        storefrontCartridges = [...omsCartridges, ...storefrontCartridges];
    }

    // append pixel tracking cartridges, if selected
    if (vars.includePixel) {
        const pixelCartridges = getPixelCartridges(vars);
        if (pixelCartridges && pixelCartridges.length) {
            storefrontCartridges = [...pixelCartridges, ...storefrontCartridges];
        }
    }

    let cartridgesToInclude = storefrontCartridges.slice();
    if (bizMngrCartridges.length) {
        cartridgesToInclude = cartridgesToInclude.concat(CARTRIDGE_PATHS.BIZ_MNGR);
    }

    // remove duplicates
    cartridgesToInclude = cartridgesToInclude.sort().reduce((a, b) => {
        if (a.indexOf(b) < 0) {
            a.push(b);
        }
        return a;
    }, []);

    const cartridges = findCartridges(process.cwd(), cartridgesToInclude);
    return {
        storefrontCartridges: storefrontCartridges,
        bizMngrCartridges: bizMngrCartridges,
        cartridges: cartridges
    };
};

/**
 * Rename the site directory to the new siteId
 * @param {string} siteDataDirectory - the site data directory
 * @param {string} siteId the new siteId
 * @param {Object} args arguments
 * @param {Logger} args.logger logger
 */
const renameSiteDirectory = (siteDataDirectory, siteId, { logger, vars }) => {
    const directoryPath = path.resolve(path.join(process.cwd(), DIRECTORIES.BASE_DATA_DIR, siteDataDirectory, 'sites'));
    const siteDirectories = fs.readdirSync(directoryPath).filter(file => fs.statSync(path.join(directoryPath, file)).isDirectory());
    if (siteDirectories.length > 0) {
        const oldSiteId = siteDirectories[0];
        if (oldSiteId === siteId) {
            logger.info(`Directory "${directoryPath}/${oldSiteId}" is already named "${siteId}", no update required.`);
        } else {
            const currentPath = path.resolve(`${directoryPath}/${oldSiteId}`);
            const newPath = path.resolve(`${directoryPath}/${siteId}`);
            try {
                fs.renameSync(currentPath, newPath);
                vars.updatedSiteDirectories.push({
                    originalPath: currentPath,
                    updatedPath: newPath
                });
                logger.info(`Successfully renamed "${directoryPath}/${oldSiteId}" directory to "${siteId}".`);
            } catch (e) {
                logger.error(`Error renaming "${directoryPath}/${oldSiteId}" directory to "${siteId}"; ${e.message}`);
            }
        }
    }
};

/**
 * Restore the site directory to the originally named siteId
 * @param {Array} updatedSiteDirectories - array of objects with originalPath and updatedPath
 * @param {Object} args arguments
 * @param {Logger} args.logger logger
 */
const restoreSiteDirectories = (updatedSiteDirectories, { logger }) => {
    if (!updatedSiteDirectories || !updatedSiteDirectories.length) {
        logger.warn('restoreSiteDirectories -> no updated site directories provided!');
        return;
    }
    updatedSiteDirectories.forEach((siteDirectory) => {
        if (siteDirectory.originalPath && siteDirectory.updatedPath) {
            try {
                if (fs.existsSync(siteDirectory.updatedPath) && !fs.existsSync(siteDirectory.originalPath)) {
                    fs.renameSync(siteDirectory.updatedPath, siteDirectory.originalPath);
                    logger.info(`Successfully restored "${siteDirectory.originalPath}".`);
                }
            } catch (e) {
                logger.error(`Error restoring "${siteDirectory.updatedPath}" to "${siteDirectory.originalPath}"; ${e.message}`);
            }
        }
    });
};

/**
 * Loop the data folders and rename any directories containing "_site" with the new siteId
 * @param {string} siteId - the new siteId
 * @param {Object} args arguments
 * @param {Logger} args.logger logger
 */
const renameSiteDirectories = (siteId, { logger, vars }) => {
    Object.keys(DIRECTORIES.DATA_DIRS).forEach((key) => {
        var folders = DIRECTORIES.DATA_DIRS[key];
        folders.forEach((folder) => {
            if (folder.includes('_site')) {
                renameSiteDirectory(folder, siteId, { logger, vars });
            }
        });
    });
};

/**
 * Get the list of data to include for a given social channel.
 * @param {Object} args arguments
 * @param {Object} args.vars variables object
 * @param {string} vars.socialChannel - the social channel
 * @param {string} vars.omsOption - the OMS option
 * @returns {Object} list of cartridge names and directory path
 */
const gatherDataDetails = ({ vars, logger }) => {
    let dataFolders = [...DIRECTORIES.DATA_DIRS.ALL_CHANNELS];

    // replace RefArch site name with the site ID in all _sites data folders
    vars.updatedSiteDirectories = [];
    renameSiteDirectories(vars.siteId, { logger, vars });

    if (vars.socialChannel === 'ALL_CHANNELS') {
        dataFolders = [
            ...dataFolders,
            ...DIRECTORIES.DATA_DIRS.GOOGLE,
            ...DIRECTORIES.DATA_DIRS.INSTAGRAM,
            ...DIRECTORIES.DATA_DIRS.SNAPCHAT,
            ...DIRECTORIES.DATA_DIRS.TIKTOK
        ];
    } else if (Object.hasOwnProperty.call(DIRECTORIES.DATA_DIRS, vars.socialChannelBase) && DIRECTORIES.DATA_DIRS[vars.socialChannelBase].length) {
        dataFolders = [...dataFolders, ...DIRECTORIES.DATA_DIRS[vars.socialChannelBase]];
    }

    // add OCI data folder
    if (vars.includeOCI) {
        dataFolders = [...dataFolders, ...DIRECTORIES.DATA_DIRS.OCI];
    }

    return {
        dataFolders: dataFolders
    };
};

/**
 * Get the list of cartridges and data to include for a given social channel.
 * @param {Object} args arguments
 * @param {Object} args.vars variables
 * @param {string} vars.socialChannel - the social channel
 * @param {string} vars.omsOption - the OMS option
 * @returns {Object} list of cartridge names and directory path
 */
const getSocialChannelDetails = ({ vars, logger }) => {
    const cartridgeDetails = gatherCartridgeDetails({ vars });
    const dataDetails = gatherDataDetails({ vars, logger });
    return Object.assign(cartridgeDetails, dataDetails);
};

/**
 * Get Business Manager cartridge path via Site Import and Export
 * @param {Object} args arguments
 * @param {Environment} args.env - environment
 * @param {MigrationHelpers} args.helpers helpers
 */
const getBizMngrCartridgePath = async ({ env, helpers }) => {
    const { siteArchiveExportJSON } = helpers;

    const archive = await siteArchiveExportJSON(env, {
        global_data: {
            preferences: true
        }
    });
    const prefs = archive.get('preferences.xml').preferences['standard-preferences'][0]['all-instances'][0].preference;
    let cartridges = [];
    try {
        cartridges = prefs.find((p) => p.$['preference-id'] === 'CustomCartridges')._.split(':');
    } catch (e) {
        /* ignore when empty */
    }
    return cartridges;
};

/**
 * Update the site cartridge path
 * @param {Array} cartridgeList - the list of cartridge names
 * @param {string} siteId - the site ID
 * @param {Object} args arguments
 * @param {Environment} args.env - environment
 * @param {MigrationHelpers} args.helpers helpers
 * @param {Logger} args.logger - logger
 */
const updateCartridgePath = async (cartridgeList, siteId, { env, helpers, logger }) => {
    /* eslint-disable no-await-in-loop */
    if (!cartridgeList || !siteId) return;

    try {
        const lastIndex = cartridgeList.length - 1;

        let currentCartridges = [];
        // get current cartridge path
        if (siteId === BIZ_MNGR_SITE_ID) {
            // get current cartridge path via Site Import/Export, OCAPI GET does not support Sites-Site
            currentCartridges = await getBizMngrCartridgePath({ env, helpers, logger });
        } else {
            // get current cartridge path via OCAPI
            let siteInfo = await env.ocapi.get(`sites/${siteId}`);
            currentCartridges = siteInfo.data.cartridges.split(':');
        }
        logger.debug(`current cartridge path for ${siteId}: ${currentCartridges.join(':')}`);

        for (let i = lastIndex; i >= 0; i--) {
            let cartridgeName = cartridgeList[i];

            // remove cartridge from cartridge path to ensure the sequence is correct
            if (currentCartridges.includes(cartridgeName)) {
                await env.ocapi.delete(`sites/${siteId}/cartridges/${cartridgeName}`);
            }

            let payload = { name: cartridgeName };
            if (i === lastIndex) {
                if (siteId === BIZ_MNGR_SITE_ID) {
                    payload.position = 'first';
                } else {
                    payload.position = 'last';
                    if (currentCartridges.includes('app_storefront_base')) {
                        payload.target = 'app_storefront_base';
                        payload.position = 'before';
                    }
                }
            } else {
                payload.target = cartridgeList[i + 1];
                payload.position = 'before';
            }

            // add cartridge path via OCAPI
            logger.info(`adding cartridge ${cartridgeName} to ${siteId} cartridge path`);
            logger.debug(JSON.stringify(payload, null, 2));
            await env.ocapi.post(`sites/${siteId}/cartridges`, payload);
        }
    } catch (e) {
        logger.error(`error updating cartridge paths for ${siteId}: ${e.message}`);
    }
    /* eslint-enable no-await-in-loop */
};

/**
 * remove cartridge name from the cartridge paths
 * @param {Object} args arguments
 * @param {Environment} args.env environment
 * @param {Logger} args.logger logger
 * @param {MigrationHelpers} args.helpers helpers
 * @param {Array} cartridgesToRemove - the cartridge name to remove
 * @param {Array} siteIds - the site IDs to remove the cartridge from
 */
const removeFromCartridgePath = async ({ env, logger, helpers }, cartridgesToRemove, siteIds = []) => {
    /* eslint-disable no-await-in-loop */
    try {
        for (let i = 0; i < siteIds.length; i++) {
            let siteId = siteIds[i];

            let currentCartridges = [];
            // get current cartridge path
            if (siteId === BIZ_MNGR_SITE_ID) {
                // get current cartridge path via Site Import/Export, OCAPI GET does not support Sites-Site
                currentCartridges = await getBizMngrCartridgePath({ env, helpers, logger });
            } else {
                // get current cartridge path via OCAPI
                let siteInfo = await env.ocapi.get(`sites/${siteId}`);
                currentCartridges = siteInfo.data.cartridges.split(':');
            }

            for (let j = 0; j < cartridgesToRemove.length; j++) {
                var cartridgeToRemove = cartridgesToRemove[j];
                if (!currentCartridges.includes(cartridgeToRemove)) {
                    continue; // eslint-disable-line no-continue
                }

                logger.info(`Removing ${cartridgeToRemove} from ${siteId}`);
                await env.ocapi.delete(`sites/${siteId}/cartridges/${cartridgeToRemove}`);
            }
        }
    } catch (e) {
        logger.debug(e.message);
        logger.error('error removing cartridges from cartridge path, you may need to manually remove the cartridges from the cartridge path');
    }
    /* eslint-enable no-await-in-loop */
};

/**
 * Get all cartridges from constant
 * @returns {Array} - all cartridges
 */
const getCartridgeListFromConstant = () => {
    let allCartridges = [];
    Object.keys(CARTRIDGES).forEach((key) => {
        if (Array.isArray(CARTRIDGES[key])) {
            allCartridges = [...allCartridges, ...CARTRIDGES[key]];
        } else if (typeof CARTRIDGES[key] === 'object') {
            Object.keys(CARTRIDGES[key]).forEach((objKey) => {
                allCartridges = [...allCartridges, ...CARTRIDGES[key][objKey]];
            });
        }
    });
    return allCartridges;
};

/**
 * Get the request body for the site preferences
 * @param {string} socialChannelBase - the social channel (TIKTOK)
 * @returns {Object} - the request body
 */
const getSitePreferenceRequestBody = (socialChannelBase) => {
    if (!socialChannelBase) return null;

    switch (socialChannelBase) {
        case 'TIKTOK':
            // only verify webdav and biz mngr credentials for TikTok Shop
            return {
                c_tiktokVerifyBM: true,
                c_tiktokVerifyWebDav: true
            };
        default:
            return null;
    }
};

/**
 * Get the base OCAPI config object
 * @returns {Object} base OCAPI config
 */
const getBaseOcapiObject = () => {
    return {
        _v: OCAPI_VERSION,
        clients: []
    };
};

/**
 * Get the base WebDAV config object
 * @returns {Object} base WebDAV config
 */
const getBaseWebDavObject = () => {
    return {
        clients: []
    };
};

/**
 * Update OCAPI permissions
 * @param {Object} document - OCAPI document from site export
 * @param {string} clientId - OCAPI client ID
 * @param {Object} resources - OCAPI permissions
 * @returns {Object} updated document
 */
const updateOcapiPermissions = (document, clientId, resources) => {
    let client = document.clients.find((c) => c.client_id === clientId);
    if (!client) {
        document.clients.push({
            client_id: clientId,
            resources: resources
        });
        return document;
    }
    if (!client.resources) {
        client.resources = [];
    }
    if (client.resources.length) {
        let combined = [...client.resources, ...resources];
        let unique = combined.reduce((a, b) => {
            if (!a.find(x => x.resource_id === b.resource_id)) {
                a.push(b);
            }
            return a;
        }, []);

        client.resources = unique;
        return document;
    }
    client.resources = resources;
    return document;
};

/**
 * Update WebDAV permissions
 * @param {Object} document - WebDAV document from site export
 * @param {string} clientId - WebDAV client ID
 * @param {Object} permissions - WebDAV permissions
 * @returns {Object} updated document
 */
const updateWebDavPermissions = (document, clientId, permissions) => {
    let client = document.clients.find((c) => c.client_id === clientId);
    if (!client) {
        document.clients.push({
            client_id: clientId,
            permissions: permissions
        });
        return document;
    }
    if (!client.permissions) {
        client.permissions = [];
    }
    if (client.permissions.length) {
        let combined = [...client.permissions, ...permissions];
        let unique = combined.reduce((a, b) => {
            if (!a.find(x => x.path === b.path)) {
                a.push(b);
            }
            return a;
        }, []);

        client.permissions = unique;
        return document;
    }
    client.permissions = permissions;
    return document;
};

/**
 * update OCAPI and WebDAV preferences for social channels
 * @param {Object} args arguments
 * @param {Environment} args.env environment
 * @param {Logger} args.logger logger
 * @param {MigrationHelpers} args.helpers helpers
 * @param {Object} args.vars variables object
 */
const updateOcapiWebDavPermissions = async ({ env, logger, helpers, vars }) => {
    const { siteArchiveExportJSON, siteArchiveImportJSON } = helpers;

    if (!vars.ocapiClientId) return;

    let clientId = vars.ocapiClientId;
    let socialChannelBase = vars.socialChannelBase;
    let archive;
    const ignoreKeys = ['B2C_TOOLS'];

    // export current OCAPI and WebDAV settings
    try {
        archive = await siteArchiveExportJSON(env, {
            global_data: {
                ocapi_settings: true,
                webdav_client_permissions: true
            }
        });
    } catch (e) {
        logger.error(e.message);
    }

    if (!archive) {
        logger.error(`Error importing updated OCAPI and WebDAV permissions for client ID: ${clientId}`);
        return;
    }

    let ocapiDataDoc = archive.get('ocapi-settings/wapi_data_config.json');
    let ocapiShopDoc = archive.get('ocapi-settings/wapi_shop_config.json');
    let webDavDoc = archive.get('webdav/client_permissions.json');

    // make sure base OCAPI and WebDAV objects exists
    if (!ocapiDataDoc || !ocapiDataDoc._v || !ocapiDataDoc.clients) { // eslint-disable-line no-underscore-dangle
        ocapiDataDoc = getBaseOcapiObject();
    }
    if (!ocapiShopDoc || !ocapiShopDoc._v || !ocapiShopDoc.clients) { // eslint-disable-line no-underscore-dangle
        ocapiShopDoc = getBaseOcapiObject();
    }
    if (!webDavDoc || !webDavDoc.clients) {
        webDavDoc = getBaseWebDavObject();
    }

    // set OCAPI data resources and WebDAV permissions
    if (socialChannelBase === 'ALL') {
        // loop all configs and ensure they are present
        Object.keys(DATA_API_RESOURCES).forEach((key)=> {
            if (ignoreKeys.indexOf(key) === -1) {
                updateOcapiPermissions(ocapiDataDoc, clientId, DATA_API_RESOURCES[key]);
            }
        });
        Object.keys(SHOP_API_RESOURCES).forEach((key)=> {
            if (ignoreKeys.indexOf(key) === -1) {
                updateOcapiPermissions(ocapiShopDoc, clientId, SHOP_API_RESOURCES[key]);
            }
        });
        Object.keys(WEBDAV_PERMISSIONS).forEach((key)=> {
            if (ignoreKeys.indexOf(key) === -1) {
                updateWebDavPermissions(webDavDoc, clientId, WEBDAV_PERMISSIONS[key]);
            }
        });
    } else {
        // OCAPI Data
        if (Object.hasOwnProperty.call(DATA_API_RESOURCES, 'ALL') && DATA_API_RESOURCES.ALL.length) {
            updateOcapiPermissions(ocapiDataDoc, clientId, DATA_API_RESOURCES.ALL);
        }
        if (Object.hasOwnProperty.call(DATA_API_RESOURCES, socialChannelBase) && DATA_API_RESOURCES[socialChannelBase].length) {
            updateOcapiPermissions(ocapiDataDoc, clientId, DATA_API_RESOURCES[socialChannelBase]);
        }
        // OCAPI Shop
        if (Object.hasOwnProperty.call(SHOP_API_RESOURCES, 'ALL') && SHOP_API_RESOURCES.ALL.length) {
            updateOcapiPermissions(ocapiShopDoc, clientId, SHOP_API_RESOURCES.ALL);
        }
        if (Object.hasOwnProperty.call(SHOP_API_RESOURCES, socialChannelBase) && SHOP_API_RESOURCES[socialChannelBase].length) {
            updateOcapiPermissions(ocapiShopDoc, clientId, SHOP_API_RESOURCES[socialChannelBase]);
        }
        // WebDAV
        if (Object.hasOwnProperty.call(WEBDAV_PERMISSIONS, 'ALL') && WEBDAV_PERMISSIONS.ALL.length) {
            updateWebDavPermissions(webDavDoc, clientId, WEBDAV_PERMISSIONS.ALL);
        }
        if (Object.hasOwnProperty.call(WEBDAV_PERMISSIONS, socialChannelBase) && WEBDAV_PERMISSIONS[socialChannelBase].length) {
            updateWebDavPermissions(webDavDoc, clientId, WEBDAV_PERMISSIONS[socialChannelBase]);
        }
    }

    // add updates to the archive
    archive.set('ocapi-settings/wapi_data_config.json', ocapiDataDoc);
    archive.set('ocapi-settings/wapi_shop_config.json', ocapiShopDoc);
    archive.set('webdav/client_permissions.json', webDavDoc);

    // import the updated archive to the sandbox
    logger.info(`Importing updated OCAPI and WebDAV permissions for client ID: ${clientId}`);
    await siteArchiveImportJSON(env, archive);
};

/**
 * update site preferences based on social channel selection
 * @param {Object} args arguments
 * @param {Environment} args.env environment
 * @param {Logger} args.logger logger
 * @param {Array} siteIds - the site IDs to update the site preferences for
 * @param {Array} sitePreferenceGroup - the site preference group to update
 * @param {Object} reqBody - the request body to update the site preferences
 */
const updateSitePreferences = async ({ env, logger }, siteIds = [], sitePreferenceGroup = null, reqBody = {}) => {
    /* eslint-disable no-await-in-loop */
    try {
        if (!siteIds.length || !sitePreferenceGroup) {
            logger.error('error updating site preferences, check required parameters');
        }
        const instanceType = getInstanceType(env);
        for (let i = 0; i < siteIds.length; i++) {
            let siteId = siteIds[i];
            logger.info(`Updating site preferences for ${siteId}`);
            await env.ocapi.patch(`/sites/${siteId}/site_preferences/preference_groups/${sitePreferenceGroup}/${instanceType}`, reqBody);
        }
    } catch (e) {
        logger.error('error updating site preferences');
    }
    /* eslint-enable no-await-in-loop */
};

/**
 * get tenant ID
 * @param {Environment} env environment
 * @param {Object} vars variables
 * @returns {string} tenant id
 */
const getTenant = (env, vars) => {
    if (vars.orgId) {
        return vars.orgId.replace('f_ecom_', '');
    }
    return env.server.split('.').shift().replace('-', '_');
};

/**
 * create UUID for private client ID and secret
 * @returns {string} UUID
 */
const uuid4 = () => {
    /* eslint-disable no-bitwise */
    var rnd = crypto.randomBytes(16);
    rnd[6] = (rnd[6] & 0x0f) | 0x40;
    rnd[8] = (rnd[8] & 0x3f) | 0x80;
    rnd = rnd.toString('hex').match(/(.{8})(.{4})(.{4})(.{4})(.{12})/);
    rnd.shift();
    return rnd.join('-');
    /* eslint-enable no-bitwise */
};

/**
 * check if SCAPI client is required for the given social channel
 * @param {string} socialChannel - the social channel
 * @returns {boolean} true/false
 */
const isScapiClientRequired = (socialChannel) => {
    if (socialChannel === SOCIAL_CHANNELS.ALL_CHANNELS) {
        for (const key in SCAPI_CLIENT_REQUIRED) {
            if (Object.hasOwnProperty.call(SCAPI_CLIENT_REQUIRED, key) && SCAPI_CLIENT_REQUIRED[key]) {
                return true;
            }
        }
        return false;
    }
    return socialChannel && Object.hasOwnProperty.call(SCAPI_CLIENT_REQUIRED, socialChannel) && SCAPI_CLIENT_REQUIRED[socialChannel];
};

/**
 * update OCAPI permissions for a SCAPI/SLAS client ID
 * @param {Object} args arguments
 * @param {Environment} args.env environment
 * @param {Logger} args.logger logger
 * @param {MigrationHelpers} args.helpers helpers
 * @param {Object} args.vars variables object
 */
const updateScapiPermissions = async ({ env, logger, helpers, vars }) => {
    if (vars.socialChannelBase !== 'ALL' && !isScapiClientRequired(vars.socialChannel)) {
        logger.warn(`SCAPI client Id not required for "${vars.socialChannel}, no updates will be made"`);
        return;
    }

    const { siteArchiveExportJSON, siteArchiveImportJSON } = helpers;

    if (!vars.scapiClientId) return;

    let clientId = vars.scapiClientId;
    let socialChannelBase = vars.socialChannelBase;
    let archive;
    const ignoreKeys = ['B2C_TOOLS'];

    // export current OCAPI and WebDAV settings
    try {
        archive = await siteArchiveExportJSON(env, {
            global_data: {
                ocapi_settings: true
            }
        });
    } catch (e) {
        logger.error(e.message);
    }

    if (!archive) {
        logger.error(`Error importing updated OCAPI permissions for SCAPI client ID: ${clientId}`);
        return;
    }

    archive.delete('ocapi-settings/wapi_data_config.json');
    let ocapiShopDoc = archive.get('ocapi-settings/wapi_shop_config.json');

    // make sure base OCAPI objects exists
    if (!ocapiShopDoc || !ocapiShopDoc._v || !ocapiShopDoc.clients) { // eslint-disable-line no-underscore-dangle
        ocapiShopDoc = getBaseOcapiObject();
    }

    // set OCAPI data resources
    if (socialChannelBase === 'ALL') {
        // loop all configs and ensure they are present
        Object.keys(SHOP_API_RESOURCES_SCAPI).forEach((key)=> {
            if (ignoreKeys.indexOf(key) === -1) {
                updateOcapiPermissions(ocapiShopDoc, clientId, SHOP_API_RESOURCES_SCAPI[key]);
            }
        });
    } else {
        // OCAPI Shop
        if (Object.hasOwnProperty.call(SHOP_API_RESOURCES_SCAPI, 'ALL') && SHOP_API_RESOURCES_SCAPI.ALL.length) {
            updateOcapiPermissions(ocapiShopDoc, clientId, SHOP_API_RESOURCES_SCAPI.ALL);
        }
        if (Object.hasOwnProperty.call(SHOP_API_RESOURCES_SCAPI, socialChannelBase) && SHOP_API_RESOURCES_SCAPI[socialChannelBase].length) {
            updateOcapiPermissions(ocapiShopDoc, clientId, SHOP_API_RESOURCES_SCAPI[socialChannelBase]);
        }
    }

    // add updates to the archive
    archive.set('ocapi-settings/wapi_shop_config.json', ocapiShopDoc);

    // import the updated archive to the sandbox
    logger.info(`Importing updated OCAPI permissions for client ID: ${clientId}`);
    await siteArchiveImportJSON(env, archive);
};

/**
 * upsert Salesforce Commmerce Cloud API client
 * @param {Object} args arguments
 * @param {Environment} args.env environment
 * @param {Logger} args.logger logger
 * @param {Object} args.vars variables object
 * @returns {Promise<void>} void
 */
const upsertScapiClient = async ({ env, logger, vars }) => {
    if (vars.socialChannelBase !== 'ALL' && !isScapiClientRequired(vars.socialChannel)) {
        logger.warn(`SCAPI client Id not required for "${vars.socialChannel}, no updates will be made"`);
        return;
    }

    // these may be undefined
    var clientId = vars.scapiClientId;
    var clientSecret = vars.scapiClientSecret;

    // see if we need to create a new client
    if (clientId === 'create') {
        logger.debug('Generating SCAPI client ID');
        clientId = uuid4();
        logger.debug(`Client ID ${clientId} generated`);
    }

    if (!clientId) {
        logger.warn('SCAPI client ID was not provided, "create" flag was not provided; no updates will be made');
        return;
    }

    if (!clientSecret) {
        logger.debug('Generating SCAPI client secret');
        clientSecret = uuid4().replace(/-/g, '');
    }
    var tenant = getTenant(env, vars);

    try {
        var sites = await env.ocapi.get('sites');
        var siteIds = sites.data.data.map(s => s.id);

        const callbacks = [];
        const redirects = [];
        logger.debug(`Adding channels ${siteIds}`);
        for (let i = 0; i < siteIds; i++) {
            let siteId = siteIds[i];
            // the actual locale here does not matter as it will not be redirected
            redirects.push(`https://${env.server}/on/demandware.store/Sites-${siteId}-Site/default/SLASCallback-RetrieveCode`);
        }

        const client = {
            name: SCAPI_CLIENT_NAME,
            clientId: clientId,
            secret: clientSecret,
            isPrivateClient: 'true',
            channels: siteIds,
            scopes: SCAPI_SCOPES.SOCIAL,
            redirectUri: redirects,
            callbackUri: callbacks
        };

        try {
            await env.scapi.get(`shopper/auth-admin/v1/tenants/${tenant}`);
        } catch (e) {
            if (e.response && e.response.status === 400 && e.response.data.exception_name === 'TenantNotFoundException') {
                // need to create the tenant
                logger.info('Creating SLAS tenant...');
                await env.scapi.put(`shopper/auth-admin/v1/tenants/${tenant}`, {
                    instance: tenant,
                    description: process.env.SFCC_SLAS_TENANT_DESC || 'Tenant for API Access',
                    merchantName: process.env.SFCC_SLAS_TENANT_MERCHANT_NAME || 'Salesforce',
                    contact: process.env.SFCC_SLAS_TENANT_CONTACT || 'Admin User',
                    emailAddress: process.env.SFCC_SLAS_TENANT_EMAIL || 'admin@salesforce.com'
                });
            } else {
                logger.error(e.message);
                logger.warn(`Could not get tenant ${tenant}, unable to manage SLAS client automatically`);
                delete vars.scapiClientId;
                delete vars.scapiClientSecret;
                return;
            }
        }
        logger.info('Updating client...');
        logger.debug(client);
        await env.scapi.put(`shopper/auth-admin/v1/tenants/${tenant}/clients/${clientId}`, client);

        // if successful set the vars to continue; otherwise these will be queried/assumed to be correct
        vars.scapiClientId = clientId;
        vars.scapiClientSecret = clientSecret;
    } catch (e) {
        logger.debug(e);
        logger.warn('Unable to manage SLAS client automatically');
        delete vars.scapiClientId;
        delete vars.scapiClientSecret;
    }
};

/**
 * Delete Commerce API client ID on feature removal
 * @param {Object} args arguments
 * @param {Environment} args.env environment
 * @param {Logger} args.logger logger
 * @param {Object} args.vars variables object
 * @returns {Promise<void>} void
 */
const removeScapiClient = async ({ env, logger, vars }) => {
    var tenant = getTenant(env, vars);
    var clientId = vars.scapiClientId;
    if (!clientId) {
        return;
    }

    try {
        logger.info(`Removing SCAPI client ID ${clientId}`);
        await env.scapi.delete(`shopper/auth-admin/v1/tenants/${tenant}/clients/${clientId}`);
    } catch (e) {
        logger.debug(e.message);
        logger.error(`Unable to remove SCAPI client ID ${clientId}. You may need to manually remove!`);
    }
};

const ACCESS_ROLES_XML_TEMPLATE = (rolesXml) => `<?xml version="1.0" encoding="UTF-8"?>
<access-roles xmlns="http://www.demandware.com/xml/impex/accessrole/2007-09-05">
    ${rolesXml}
</access-roles>`;

const ACCESS_ROLE_XML_TEMPLATE = ({ roleId, roleDescription, accessControlXml }) => `<access-role role-id="${roleId}">
        <description>${roleDescription}</description>
        <access-controls>
            ${accessControlXml}
        </access-controls>
    </access-role>`;

/**
 * Write access-roles.xml and import role
 * @param {Object} args arguments
 * @param {Environment} args.env environment
 * @param {Logger} args.logger logger
 * @returns {Promise<void>} void
 */
const writeAndImportAccessRole = async ({ env, logger, helpers }) => {
    const { siteArchiveImportText } = helpers;

    logger.info('Building access roles xml file');

    try {
        let sites = await env.ocapi.get('sites');
        let siteIds = sites.data.data.map(s => s.id);

        let siteAccessControlXml = '';
        for (let i = 0; i < siteIds.length; i++) {
            let siteId = siteIds[i];
            siteAccessControlXml += `<access-control resource-path="BUSINESSMGR/CustomMenu/Sites/${siteId}/social_channels_google" permission="ACCESS"/>
            <access-control resource-path="BUSINESSMGR/CustomMenu/Sites/${siteId}/social_channels_snapchat" permission="ACCESS"/>
            <access-control resource-path="BUSINESSMGR/CustomMenu/Sites/${siteId}/social_channels_tiktok" permission="ACCESS"/>
            <access-control resource-path="BUSINESSMGR/SystemMenu/Sites/${siteId}/orders_manage" permission="ACCESS"/>
            <access-control resource-path="BUSINESSMGR/SystemMenu/Sites/${siteId}/site-obj_impex" permission="ACCESS"/>
            <access-control resource-path="OBJECT/Site/Sites/${siteId}" permission="Create_Order_On_Behalf_Of"/>
            <access-control resource-path="OBJECT/Site/Sites/${siteId}" permission="Delete_Order_Note"/>
            <access-control resource-path="OBJECT/Site/Sites/${siteId}" permission="Handle_External_Orders"/>
            <access-control resource-path="OBJECT/Site/Sites/${siteId}" permission="Login_On_Behalf"/>
            <access-control resource-path="OBJECT/Site/Sites/${siteId}" permission="Search_Orders"/>`;
        }
        let accessControlXml = `<access-control resource-path="BUSINESSMGR/CustomMenu/Sites/-/customfeeds" permission="ACCESS"/>
            <access-control resource-path="BUSINESSMGR/SystemMenu/Sites/-/jobmonitor" permission="ACCESS"/>
            <access-control resource-path="BUSINESSMGR/SystemMenu/Sites/-/jobschedules" permission="ACCESS"/>
            ${siteAccessControlXml}
            <access-control resource-path="LOCALES/default" permission="READONLY"/>
            <access-control resource-path="WEBDAV/Sites/IMPEX/src/feeds/export" permission="ACCESS"/>`;

        const roleId = 'SocialChannels';
        const roleDescription = 'This role handles all permissions for the users of the Social Channels Integration';

        const xmlMapping = [
            'access-roles.xml',
            ACCESS_ROLES_XML_TEMPLATE(ACCESS_ROLE_XML_TEMPLATE({ roleId, roleDescription, accessControlXml }))
        ];
        logger.info('Importing access roles xml file');
        await siteArchiveImportText(env, new Map([xmlMapping]));
    } catch (e) {
        logger.debug(e.message);
        logger.error('Unable to to create access roles. Refer to the documentation to configure business manager permissions.');
    }
};

module.exports = {
    createKey,
    createListOption,
    getCartridgeListFromConstant,
    getSitePreferenceRequestBody,
    getSocialChannelDetails,
    removeFromCartridgePath,
    removeScapiClient,
    renameSiteDirectories,
    restoreSiteDirectories,
    updateCartridgePath,
    updateOcapiWebDavPermissions,
    updateScapiPermissions,
    updateSitePreferences,
    upsertScapiClient,
    writeAndImportAccessRole
};
