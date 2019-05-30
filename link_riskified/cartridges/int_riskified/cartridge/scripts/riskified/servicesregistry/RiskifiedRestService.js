/**
*
* Riskified API REST over HTTPS
* SFCC service definition file
*
* @todo: Filter log messages,
*        Handle empty 'params.action' case
*
*/
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var Site = require('dw/system/Site');
var rskfdRestService = LocalServiceRegistry.createService('int_riskified.https.api', {

    createRequest: function (service, params) {
        var merchantDomainAddressOnRiskified = service.getConfiguration().getCredential().getUser();
        if (Site.getCurrent().getPreferences().custom.DECOEnable) {
        	merchantDomainAddressOnRiskified = require('int_riskified/cartridge/scripts/riskified/servicesregistry/DecoRestService').getConfiguration().getCredential().getUser();
        }
        var riskifiedBaseURL = service.getConfiguration().getCredential().getURL();
        // var riskifiedBaseURL = 'https://sandbox.riskified.com/api';

        service.addHeader('Accept', 'application/vnd.riskified.com; version=2');
        service.addHeader('Content-Type', 'application/json');
        service.addHeader('charset', 'utf-8');
        service.addHeader('Accept-Encoding', 'identity');

        service.addHeader('X_RISKIFIED_HMAC_SHA256', params.hmac);
        service.addHeader('X_RISKIFIED_SHOP_DOMAIN', merchantDomainAddressOnRiskified);

        if ('action' in params) {
            switch (params.action) {
            case 'cancel':
                service.setRequestMethod('POST');
                service.setURL(riskifiedBaseURL + '/cancel');
                break;

            case 'create':
                service.setRequestMethod('POST');
                service.setURL(riskifiedBaseURL + '/create');
                break;

            case 'checkout_create':
                service.setRequestMethod('POST');
                service.setURL(riskifiedBaseURL + '/checkout_create');
                break;

            case 'checkout_denied':
                service.setRequestMethod('POST');
                service.setURL(riskifiedBaseURL + '/checkout_denied');
                break;

            case 'decision':
                service.setRequestMethod('POST');
                service.setURL(riskifiedBaseURL + '/decision');
                break;

            case 'fulfill':
                service.setRequestMethod('POST');
                service.setURL(riskifiedBaseURL + '/fulfill');
                break;

            case 'historical':
                service.setRequestMethod('POST');
                service.setURL(riskifiedBaseURL + '/historical');
                break;

            case 'refund':
                service.setRequestMethod('POST');
                service.setURL(riskifiedBaseURL + '/refund');
                break;

            case 'update':
                service.setRequestMethod('POST');
                service.setURL(riskifiedBaseURL + '/update');
                break;

            default:
                throw new Error('RiskifiedRestService: unknown `action` parameter value. Value: ' + params.action + '.');
            }
        } else {
            throw new Error('RiskifiedRestService: required `action` parameter is empty.');
        }

        return params.payload;
    },

    parseResponse: function (service, client) {
        return client.text;
    },

    getRequestLogMessage: function () {
    },

    getResponseLogMessage: function () {
    }

});

module.exports = rskfdRestService;
