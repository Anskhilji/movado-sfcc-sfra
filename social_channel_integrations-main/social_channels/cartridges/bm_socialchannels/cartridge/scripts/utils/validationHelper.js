/**
 * Validation Helper for social commerce forms.
 */

'use strict';

/**
 * Validates Account Manager credentials by trying to get an access token
 * @param {String} clientId
 * @param {String} secret
 * @returns {boolean} validation pass(true) or fail
 */
function validateAMCredentials(clientId, secret) {
    if(empty(clientId) || empty(secret)) {
        return false;
    }
    //Using HTTP Client instead of service framework to reduce the installation steps
    var HTTPClient = require('dw/net/HTTPClient');
    var httpClient = new HTTPClient();
    try {
        httpClient.open("POST", "https://account.demandware.com/dwsso/oauth2/access_token?grant_type=client_credentials");
        httpClient.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        httpClient.setRequestHeader("Authorization", "Basic " + require('dw/util/StringUtils').encodeBase64(clientId+':'+secret));
        
        httpClient.setTimeout(1000); //setting the timeout to 1s

        // Send request
        httpClient.send();

        // Handle response and validate existence of access_token
        if (httpClient.statusCode === 200) {
            var response = JSON.parse(httpClient.text);
            if(response && response.access_token) {
                return true;
            }
        }
    } catch (e) {
        return false;
    }
    return false;
}

/**
 * Validates org id format to be aligned with standard - f_ecom_zzcu_stg
 * @param {String} orgId
 * @returns {boolean} validation pass(true) or fail
 */
function validateOrgId(orgId) {
    var regex = new RegExp("^f_ecom_[a-zA-Z0-9]{4}_(stg|dev|\\d{1,3}|prd)$");
    if (regex.test(orgId)) {
        return true;
    }
    return false;
}

module.exports = {
    validateAMCredentials: validateAMCredentials,
    validateOrgId: validateOrgId
};