'use strict';

var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Logger = require('dw/system/Logger');
var Transaction = require('dw/system/Transaction');
var constants = require('int_tiktok/cartridge/scripts/TikTokConstants');

/**
 * Returns the TikTok settings custom object, if it exists.
 * If it does not exist, then it creates a new custom object instance and return it
 * @param {boolean} isStorefrontRequest - is storefront reqeust?
 * @returns {dw/object/CustomObject} - custom object
 */
function getCustomObject(isStorefrontRequest) {
    var co = CustomObjectMgr.getCustomObject(constants.SOCIAL_CHANNEL_CUSTOM_OBJECT_DEFINITION, constants.TIKTOK_CUSTOM_OBJECT_ID);
    if (co) {
        return co;
    }

    // do not create custom object if this is a storefront request
    if (isStorefrontRequest) {
        Logger.warn('Missing Custom Object definition');
        return null;
    }

    return Transaction.wrap(function () {
        return CustomObjectMgr.createCustomObject(constants.SOCIAL_CHANNEL_CUSTOM_OBJECT_DEFINITION, constants.TIKTOK_CUSTOM_OBJECT_ID);
    });
}

/**
 * Clears the TikTok values from the custom object so that we can start again the process
 * @param {dw/object/CustomObject} tikTokSettings The custom object to clear
 */
function clearValues(tikTokSettings) {
    var valuesToClear = {
        custom: {
            accessToken: '',
            advertiserId: '',
            appId: '',
            appSecret: '',
            bcId: '',
            catalogId: '',
            catalogOverview: '',
            enableAdvancedMatchingEmail: false,
            enableAdvancedMatchingPhone: false,
            externalBusinessId: '',
            externalData: '',
            externalDataKey: '',
            pixelCode: '',
            refreshToken: '',
            shopperClientId: '',
            shopperClientSecret: ''
        }
    };
    Transaction.wrap(function () {
        Object.keys(valuesToClear).forEach(function (key) {
            if (Object.hasOwnProperty.call(valuesToClear, key)) {
                var objectAttrDef = tikTokSettings.describe().getSystemAttributeDefinition(key);
                if (objectAttrDef) {
                    tikTokSettings[key] = valuesToClear[key];
                }
            }
        });

        if (Object.keys(valuesToClear.custom).length) {
            Object.keys(valuesToClear.custom).forEach(function (key) {
                if (Object.hasOwnProperty.call(valuesToClear.custom, key)) {
                    var objectAttrDef = tikTokSettings.describe().getCustomAttributeDefinition(key);
                    if (objectAttrDef) {
                        tikTokSettings.custom[key] = valuesToClear.custom[key];
                    }
                }
            });
        }
    });
}

/**
 * Removes the given custom object
 *
 * @param {dw/object/CustomObject} tikTokSettings The custom object to remove
 */
function removeCustomObject(tikTokSettings) {
    Transaction.wrap(function () {
        CustomObjectMgr.remove(tikTokSettings);
    });
}

/**
 * Parse external data from tikTokSettings.custom.externalData
 * @param {Object} tikTokSettings - custom object
 * @return {Object} externalData - parsed external data
 */
function getExternalData(tikTokSettings) {
    if (!tikTokSettings || !tikTokSettings.custom.externalData) return null;

    var externalData = null;
    try {
        externalData = JSON.parse(tikTokSettings.custom.externalData);
    } catch (e) {
        Logger.error(e.toString() + ' in ' + e.fileName + ':' + e.lineNumber);
    }
    return externalData;
}

/**
 * Fills the form with the values from the custom object
 * @param {Object} tikTokSettings - custom object
 * @param {string} tenantId - the tenant ID
 * @param {boolean} fillCredentials - should credentials field be pre-filled from custom object?
 * @returns {dw.web.Form} form
 */
function fillFormFromCustomObject(tikTokSettings, tenantId, fillCredentials) {
    if (!tikTokSettings) {
        tikTokSettings = { custom: {} }; // eslint-disable-line no-param-reassign
    }

    var form = session.forms.tiktok;
    form.clearFormElement();

    var externalData = getExternalData(tikTokSettings) || {};
    var externalValuesToSet = {
        extra: {
            organization_id: 'orgid',
            sfcc_api_client_id: 'amclientid',
            sfcc_bm_user: 'bmuser',
            shopper_api_client_id: 'shopperclientid',
            hostname_alias: 'hostNameAlias'
        },
        email: 'email',
        industry_id: 'industryid',
        country_region: 'countrycode',
        website_url: 'website'
    };

    Object.keys(externalValuesToSet).forEach((key) => {
        if (!Array.isArray(externalValuesToSet[key]) && !(typeof externalValuesToSet[key] === 'object')) {
            var formKey = externalValuesToSet[key];
            if (externalData && Object.hasOwnProperty.call(externalData, key)) {
                form[formKey].value = externalData[key] || '';
            } else {
                form[formKey].value = '';
            }
        }
    });
    Object.keys(externalValuesToSet.extra).forEach((key) => {
        var formKey = externalValuesToSet.extra[key];
        if (externalData && Object.hasOwnProperty.call(externalData.extra, key)) {
            form[formKey].value = externalData.extra[key] || '';
        } else {
            form[formKey].value = '';
        }
    });

    form.tenantid.value = tikTokSettings.custom.externalBusinessId || tenantId;
    if (externalData.phone_number) {
        form.phone.value = externalData.phone_number.substr(externalData.phone_number.length - 10);
        form.countrycallingcode.value = externalData.phone_number.substr(0, externalData.phone_number.length - 10);
    } else {
        form.countrycallingcode.value = '';
        form.phone.value = '';
    }

    if (fillCredentials) {
        form.amclientsecret.value = ''; // not saved
        form.bmaccesskey.value = ''; // not saved
        form.shopperclientsecret.value = tikTokSettings.custom.shopperClientSecret || '';
    } else {
        // clear credential form fields
        form.amclientsecret.value = '';
        form.bmaccesskey.value = '';
        form.shopperclientsecret.value = '';
    }

    return form;
}

module.exports = {
    getCustomObject: getCustomObject,
    removeCustomObject: removeCustomObject,
    clearValues: clearValues,
    getExternalData: getExternalData,
    fillFormFromCustomObject: fillFormFromCustomObject
};
