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

var rskfdSyncRestService = LocalServiceRegistry.createService('int_riskified.https.sync.api', {

    createRequest: function (service, params) {
        var merchantDomainAddressOnRiskified = service.getConfiguration().getCredential().getUser(); // replacing a sitepref approach
		var merchantDomainAddressOnRiskifiedPref = Site.getCurrent().getPreferences().custom.merchantDomainAddressOnRiskified;
		if (merchantDomainAddressOnRiskifiedPref && merchantDomainAddressOnRiskifiedPref !== merchantDomainAddressOnRiskified) {
			service.setCredentialID('riskified.sync.'+merchantDomainAddressOnRiskifiedPref);
			merchantDomainAddressOnRiskified = service.getConfiguration().getCredential().getUser();
		}

        var riskifiedBaseURL = service.getConfiguration().getCredential().getURL();

        service.addHeader('Accept', 'application/vnd.riskified.com; version=2');
        service.addHeader('Content-Type', 'application/json');
        service.addHeader('charset', 'utf-8');
        service.addHeader('Accept-Encoding', 'identity');

        service.addHeader('X_RISKIFIED_HMAC_SHA256', params.hmac);
        service.addHeader('X_RISKIFIED_SHOP_DOMAIN', merchantDomainAddressOnRiskified);

        if ('action' in params) {
            switch (params.action) {
            case 'decide':
                service.setRequestMethod('POST');
                service.setURL(riskifiedBaseURL + '/decide');
                break;
            default:
                throw new Error('RiskifiedSyncRestService: unknown `action` parameter value. Value: ' + params.action + '.');
            }
        } else {
            throw new Error('RiskifiedSyncRestService: required `action` parameter is empty.');
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

module.exports = rskfdSyncRestService;
