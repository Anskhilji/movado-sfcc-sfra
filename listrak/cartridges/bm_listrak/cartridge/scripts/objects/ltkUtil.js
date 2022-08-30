/* eslint-disable no-undef */
/* eslint-disable no-underscore-dangle */
/* eslint-disable new-cap */
require('dw/system');
require('dw/util');
require('dw/net');
require('dw/object');

importScript('util/ltkErrorHandling.ds');

/** *****************************************************************
*  Client Settings
*	Purpose:	Loads client level settings and contains functions
*				for submitting information to Listrak endpoints.
********************************************************************/
function _Client() {
    this.CTID = '';
    if (!empty(dw.system.Site.current.preferences.custom.Listrak_MerchantTrackingID))    	{ this.CTID = dw.system.Site.current.preferences.custom.Listrak_MerchantTrackingID; }

    this.Endpoint = 's1.listrakbi.com';
    	if (!empty(dw.system.Site.current.preferences.custom.Listrak_TrackingEndpoint))    		{ this.Endpoint = dw.system.Site.current.preferences.custom.Listrak_TrackingEndpoint; }
}

/* Submits to the tracking endpoint. */
_Client.prototype.SubmitTracking = function (path, data) {
    return this.SubmitQueryStringData(this.Endpoint, path, data);
};

/* Method used to submit an HTTP request. */
_Client.prototype.SubmitQueryStringData = function (endpoint, path, data) {
	/* Create the HTTP service and set the timeout. */

    var strURL = null;
    var httpService = require('*/cartridge/scripts/init/httpServiceInit');
	// Check active compatibility mode; revert system objects if prior to 19.10
    if (dw.system.System.getCompatibilityMode() >= 1910) {
        strURL = 'http://' + endpoint + '/' + path + '?' + data;
        httpService.setURL(strURL);
    }	else	{
        require('dw/svc');

        strURL = 'http://' + endpoint + '/' + path + '?' + data;
        httpService.URL = strURL;
    }
    var httpResult = httpService.call();

    if (httpResult.error === 0 && httpResult.ok)	{
        return new this.SubmitQueryStringDataResponse(true, httpResult.object.toString());
    }

		/* If we were not able to successfully send to the endpoint, store the path in a CustomObject and retry later. */
    var transactionUID = UUIDUtils.createUUID();
    var dataObject = CustomObjectMgr.createCustomObject('ltk_dataObject', transactionUID);
    dataObject.custom.data = strURL;

    return new this.SubmitQueryStringDataResponse(false, '');
};

/* */
_Client.prototype.SubmitQueryStringDataResponse = function (successFlag, textResponse) {
    this.success = successFlag;
    this.response = textResponse;
};

/** *****************************************************************
*  Exception Handler
*	Purpose:	Reports error information to Listrak
********************************************************************/
function _LTKException() {
	/* Method to submit exceptions to a custom object. */
    _LTKException.prototype.Submit = function (ex, info) {
    	var message = ex.name + ' - ' + ex.message + ' - ' + info + ' - ' + ex.stack;
    	reportError(message, 'High', '');
    };
}
