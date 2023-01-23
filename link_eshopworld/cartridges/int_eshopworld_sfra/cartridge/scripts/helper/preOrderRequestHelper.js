/* eslint-disable quote-props */
/**
 * Helper script support ESW Pre Order Request.
 **/


/* API includes */
var URLUtils = require('dw/web/URLUtils');
var logger = require('dw/system/Logger');

/* Script Modules */
var eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();

/**
 * Handle Pre-Order V2. It prepares Pre-Order service request and calls it.
 * @returns {string} - if cookies not found then return blank string
 * otherwise, renders the landing page.
 */
function handlePreOrderRequestV2(eswEmail) {
    var eswCoreService = require('*/cartridge/scripts/services/EswCoreService').getEswServices(),
        preorderServiceObj = eswCoreService.getPreorderServiceV2(),
        oAuthObj = eswCoreService.getOAuthService(),
        eswServiceHelper = require('*/cartridge/scripts/helper/serviceHelper'),
        redirectPreference = eswHelper.getRedirect();
    if (redirectPreference.value !== 'Cart' && session.privacy.guestCheckout == null) {
        if (!customer.authenticated) {
            session.privacy.TargetLocation = URLUtils.https('EShopWorld-PreOrderRequest').toString();

            return {
                'status': 'REDIRECT'
            };
        }
    }
    var formData = {
        'grant_type': 'client_credentials',
        'scope': 'checkout.preorder.api.all'
    };
    formData.client_id = eswHelper.getClientID();
    formData.client_secret = eswHelper.getClientSecret();
    var oAuthResult = oAuthObj.call(formData);
    if (oAuthResult.status === 'ERROR' || empty(oAuthResult.object)) {
        logger.error('ESW Service Error: {0}', oAuthResult.errorMessage);
    }
    session.privacy.eswOAuthToken = JSON.parse(oAuthResult.object).access_token;

    var requestObj = eswServiceHelper.preparePreOrderV2(eswEmail);
    requestObj.retailerCartId = eswServiceHelper.createOrder(eswEmail);
    var result = preorderServiceObj.call(JSON.stringify(requestObj));
    return result;
}

/**
 * @param {Object} req - current req object
 * @param {Object} res - current res object
 */
function preOrderRequest(req, res, eswEmail) { // eslint-disable-line consistent-return
    try {
        var result = handlePreOrderRequestV2(eswEmail);

        if (result.status === 'REDIRECT') {
            res.json({
                'redirectURL': URLUtils.https('Checkout-Login').toString()
            });
        }
        if (result.status === 'ERROR' || empty(result.object)) {
            logger.error('ESW Service Error: {0}', result.errorMessage);
            session.privacy.eswfail = true;
            res.redirect(URLUtils.https('Cart-Show').toString());
        } else {
            var redirectURL = JSON.parse(result.object).redirectUrl;
            delete session.privacy.guestCheckout;
            res.redirect(redirectURL);
        }
    } catch (e) {
        logger.error('ESW Service Error: {0} {1}', e.message, e.stack);
        session.privacy.eswfail = true;
        res.redirect(URLUtils.https('Cart-Show').toString());
    }
}

module.exports = {
    preOrderRequest: preOrderRequest,
    handlePreOrderRequestV2: handlePreOrderRequestV2
};
