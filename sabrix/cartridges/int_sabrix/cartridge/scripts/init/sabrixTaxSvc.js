var System = require('dw/system/System');
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var HashMap = require('dw/util/HashMap');
var Port = require('dw/ws/Port');
var WSUtil = require('dw/ws/WSUtil');
var sabrixTaxHelper = require('*/cartridge/scripts/hooks/cart/sabrixTaxHelper.js');
var Resource = require('dw/web/Resource');

function getTaxService(basket) {
	var sabrix = LocalServiceRegistry.createService(Resource.msg('service.sabrix.address.title', 'sabrix', null) ,{
		initServiceClient: function() {
			var creds = this.configuration.getCredential();
			// Custom Start: implemented the 3rd party test mode option
			var Site = require('dw/system/Site');
			var customStorefrontHelpers = require('*/cartridge/scripts/helpers/customStorefrontHelpers.js');
			if (Site.current.preferences.custom.isSiteRunOnTestModel) {
			    creds = customStorefrontHelpers.setTestModeCredentials(this).configuration.getCredential();
			}
			// Custom End 
			var secretsMap = new HashMap();
			secretsMap.put(creds.user, creds.password);
			var requestCfg = new HashMap();
			requestCfg.put(WSUtil.WS_ACTION, WSUtil.WS_USERNAME_TOKEN);		
			requestCfg.put(WSUtil.WS_USER, 	creds.user);
			requestCfg.put(WSUtil.WS_PASSWORD_TYPE, WSUtil.WS_PW_TEXT );
			// set the secrets for the callback
			requestCfg.put(WSUtil.WS_SECRETS_MAP, secretsMap);
			var responseCfg = new HashMap();
			responseCfg.put(WSUtil.WS_ACTION, WSUtil.WS_NO_SECURITY);
			if(System.instanceType  == System.PRODUCTION_SYSTEM ){
				this.webReference = webreferences2.TaxCalculationServicePRD;
			} else {
				this.webReference = webreferences2.TaxCalculationServiceTest;
			}

			var port : Port = this.webReference.getDefaultService();
			WSUtil.setWSSecurityConfig(port, requestCfg, responseCfg);
			WSUtil.setProperty(Port.ENDPOINT_ADDRESS_PROPERTY, creds.URL, port); 
			return port;
		},
		// required to create a requestData object. This object must be passed to the execute method.
		createRequest: function(svc, basket) {   
			var requestObj =sabrixTaxHelper.createSabrixRequestObject(basket,svc);
			return requestObj;
		},
		// specifies additional processing for the web service request
		execute: function(svc, requestObject) {
			return svc.serviceClient.calculateTax(requestObject);
		},
		// use this method to parse the response in the Service object.
		parseResponse: function(svc,responseObject){
			return responseObject;
		},
		filterLogMessage: function (msg) {
            return msg;
        },
		mockCall: function(svc,params){
			return {
				statusCode: 200,
				statusMessage: "Success",
				text: "MOCK RESPONSE (" + svc.URL + ")"
			};
		}
	});
	
	return sabrix;
}


exports.getTaxService = getTaxService;


