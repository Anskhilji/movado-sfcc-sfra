/**
*
* Riskified API REST over HTTPS
* SFCC service definition file
*
* @todo: Filter log messages,
*
*/
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

var decoRestService = LocalServiceRegistry.createService('int_riskified.deco.https.api', {

    createRequest: function (service, params) {
        var merchantDomainAddressOnRiskified = service.getConfiguration().getCredential().getUser(); // replacing a sitepref approach
        var baseURL = service.getConfiguration().getCredential().getURL();

        service.addHeader('Accept', 'application/vnd.riskified.com; version=2');
        service.addHeader('Content-Type', 'application/json');
        service.addHeader('charset', 'utf-8');
        service.addHeader('Accept-Encoding', 'identity');

        service.addHeader('X-RISKIFIED-HMAC-SHA256', params.hmac);
        service.addHeader('X-RISKIFIED-SHOP-DOMAIN', merchantDomainAddressOnRiskified);

        if ('action' in params) {
            switch (params.action) {
            case 'checkout_create':
                service.setRequestMethod('POST');
                service.setURL(baseURL + '/checkout_create');
                break;

            case 'checkout_denied':
                service.setRequestMethod('POST');
                service.setURL(baseURL + '/checkout_denied');
                break;

            case 'create':
                service.setRequestMethod('POST');
                service.setURL(baseURL + '/create');
                break;

            case 'fulfill':
                service.setRequestMethod('POST');
                service.setURL(baseURL + '/fulfill');
                break;

            case 'cancel':
                service.setRequestMethod('POST');
                service.setURL(baseURL + '/cancel');
                break;

            case 'eligible':
                service.setRequestMethod('POST');
                service.setURL(baseURL + '/eligible');
                break;
            
            case 'opt_in':
                service.setRequestMethod('POST');
                service.setURL(baseURL + '/opt_in');
                break;

            default:
                throw new Error('DecoRestService: unknown `action` parameter value. Value: ' + params.action + '.');
            }
        } else {
            throw new Error('DecoRestService: required `action` parameter is empty.');
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

module.exports = decoRestService;
