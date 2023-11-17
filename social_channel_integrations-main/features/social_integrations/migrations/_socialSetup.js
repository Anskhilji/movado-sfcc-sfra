'use strict';

const path = require('path');

const {
    getSitePreferenceRequestBody,
    getSocialChannelDetails,
    restoreSiteDirectories,
    updateCartridgePath,
    updateOcapiWebDavPermissions,
    updateScapiPermissions,
    updateSitePreferences,
    upsertScapiClient,
    writeAndImportAccessRole
} = require('../utils/featureHelpers');

const {
    BIZ_MNGR_SITE_ID,
    DEPLOY_OPTIONS,
    DIRECTORIES,
    SITE_PREF_GROUPS
} = require('../utils/socialConstants');
const SCRIPT_NAME = '[SOCIAL SETUP]';

/**
 * Main entry point for social integration feature setup
 * @param {Object} args arguments
 * @param {Environment} args.env environment
 * @param {Logger} args.logger logger
 * @param {MigrationHelpers} args.helpers helpers
 * @param {Object} args.vars variables
 * @returns {Promise<void>} void
 */
module.exports = async function ({ env, logger, helpers, vars }) {
    if (!vars.socialChannel || !vars.deployOption) {
        logger.error(`${SCRIPT_NAME} Could not continue! missing at least 1 of the below environment variables.\n
            SFCC_VARS__socialChannel\n
            SFCC_VARS__deployOption`);
        return;
    }

    const { siteArchiveImport, syncCartridges } = helpers;

    // set social channel base
    vars.socialChannelBase = vars.socialChannel.split('_')[0];

    // gather cartridge and data details per social channel
    const socialChannelDetails = getSocialChannelDetails({ vars, logger });
    logger.debug(`${SCRIPT_NAME} ${JSON.stringify(socialChannelDetails)}`);

    // deploy channel specific data to the sandbox
    if (DEPLOY_OPTIONS.DATA_OPTIONS.includes(vars.deployOption)) {
        logger.info(`${SCRIPT_NAME} data deploy is enabled and starting.`);

        // ***********
        // import data folders to sandbox
        // ***********
        if (socialChannelDetails.dataFolders.length) {
            let dataFolders = socialChannelDetails.dataFolders;
            for (let i = 0; i < dataFolders.length; i++) {
                let dataFolder = dataFolders[i];
                let dataFolderPath = path.join(process.cwd(), DIRECTORIES.BASE_DATA_DIR, dataFolder);
                logger.info(`${SCRIPT_NAME} importing data: "${dataFolderPath}"`);
                await siteArchiveImport(env, dataFolderPath); // eslint-disable-line no-await-in-loop
            }

            // restore original site folders after site import
            if (vars.updatedSiteDirectories && vars.updatedSiteDirectories.length) {
                restoreSiteDirectories(vars.updatedSiteDirectories, { logger });
            }
        } else {
            logger.warn(`${SCRIPT_NAME} There was a problem finding the data folders to upload`);
        }

        // ***********
        // update cartridge paths for the storefront site
        // ***********
        if (socialChannelDetails.storefrontCartridges.length) {
            logger.info(`${SCRIPT_NAME} Adding cartridges to "${vars.siteId}" storefront site cartridge path: ${socialChannelDetails.storefrontCartridges.join(':')}`);
            await updateCartridgePath(socialChannelDetails.storefrontCartridges, vars.siteId, { env, helpers, logger });
        } else {
            logger.warn(`${SCRIPT_NAME} No storefront cartridges to add to the cartridge path`);
        }

        // ***********
        // update cartridge paths for the business manager site
        // ***********
        if (socialChannelDetails.bizMngrCartridges.length) {
            logger.info(`${SCRIPT_NAME} Adding cartridges to business manager cartridge path: ${socialChannelDetails.bizMngrCartridges.join(':')}`);
            await updateCartridgePath(socialChannelDetails.bizMngrCartridges, BIZ_MNGR_SITE_ID, { env, helpers, logger });
        } else {
            logger.warn(`${SCRIPT_NAME} No business manager cartridges to add to the cartridge path`);
        }

        // ***********
        // update site preferences
        // ***********
        let sitePreferenceUpdateRequests = [];
        let requestBody;
        let sitePreferenceGroup;
        if (vars.socialChannelBase === 'ALL') {
            // get site preference values for all social channels. right now, we only have site prefs for TikTok
            requestBody = getSitePreferenceRequestBody('TIKTOK');
            if (requestBody) {
                sitePreferenceUpdateRequests.push({
                    requestBody,
                    sitePreferenceGroup: SITE_PREF_GROUPS.TIKTOK
                });
            }
        } else {
            sitePreferenceGroup = Object.hasOwnProperty.call(SITE_PREF_GROUPS, vars.socialChannelBase)
                && SITE_PREF_GROUPS[vars.socialChannelBase] ? SITE_PREF_GROUPS[vars.socialChannelBase] : null;
            if (sitePreferenceGroup) {
                requestBody = getSitePreferenceRequestBody(vars.socialChannelBase);
                if (requestBody) {
                    sitePreferenceUpdateRequests.push({
                        requestBody,
                        sitePreferenceGroup
                    });
                }
            }
        }
        if (sitePreferenceUpdateRequests.length) {
            for (let i = 0; i < sitePreferenceUpdateRequests.length; i++) {
                let sitePreferenceUpdateRequest = sitePreferenceUpdateRequests[i];
                // eslint-disable-next-line no-await-in-loop
                await updateSitePreferences({ env, logger }, [vars.siteId], sitePreferenceUpdateRequest.sitePreferenceGroup, sitePreferenceUpdateRequest.requestBody);
            }
        }

        // ***********
        // update OCAPI and WebDAV permissions
        // ***********
        if (vars.ocapiClientId && vars.ocapiClientId !== 'skip') {
            await updateOcapiWebDavPermissions({ env, logger, helpers, vars });
        } else {
            logger.warn(`${SCRIPT_NAME} An OCAPI client ID was not provided. Ensure you follow the documentation to add the correct OCAPI and WebDAV permissions.`);
        }

        // ***********
        // update or create SCAPI client ID
        // ***********
        if (vars.scapiClientId) {
            // skip doing anything with SCAPI clients
            if (vars.scapiClientId === 'skip') {
                logger.info('Skipping SCAPI client updates');
                delete vars.scapiClientId;
                delete vars.scapiClientSecret;
                return;
            }
            await updateScapiPermissions({ env, logger, helpers, vars });
            await upsertScapiClient({ env, logger, helpers, vars });
        }

        // ***********
        // write and import business manager access role permissions
        // ***********
        await writeAndImportAccessRole({ env, logger, helpers, vars });
    } else {
        logger.info(`${SCRIPT_NAME} data deploy is not enabled, skipping.`);
    }

    // deploy channel specific cartridges to the sandbox
    if (DEPLOY_OPTIONS.CODE_OPTIONS.includes(vars.deployOption)) {
        logger.info(`${SCRIPT_NAME} code deploy is enabled and starting.`);
        if (socialChannelDetails.cartridges.length) {
            if (!env.codeVersion) {
                try {
                    // set env code version to current on instance
                    let resp = await env.ocapi.get('code_versions');
                    env.codeVersion = resp.data.data.find(c => c.active).id;
                } catch (e) {
                    throw new Error(`Unable to determine code version: ${e.message}`);
                }
            }

            let cartridges = socialChannelDetails.cartridges;
            logger.info(`${SCRIPT_NAME} Uploading cartridges: ${cartridges.map(c => c.dest).join(',')} to code version "${env.codeVersion}"`);
            await syncCartridges(env, cartridges, true, { cleanCartridges: true });
        } else {
            logger.warn('There was a problem finding the cartridges to upload');
        }
    } else {
        logger.info(`${SCRIPT_NAME} code deploy is not enabled, skipping.`);
    }
};
