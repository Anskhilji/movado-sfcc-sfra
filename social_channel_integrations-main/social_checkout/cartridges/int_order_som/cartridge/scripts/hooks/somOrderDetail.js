'use strict';

/**
 *  hook to call SFCC as webservice, because of no transaction handle available in the OCAPI getOrder call
 * @param {string} orderNo order number
 * @returns {Object} object with results
 */
exports.getOrderDetails = function (orderNo) {
    var URLUtils = require('dw/web/URLUtils');
    var SOMOrderDetailsService = require('*/cartridge/scripts/services/somOrderDetailsService');
    var result = {
        error: false,
        msg: ''
    };

    try {
        // get Service
        var orderDetailsSvc = SOMOrderDetailsService.getOrderDetailsService();
        // get URL for the controller
        var serviceUrl = URLUtils.https('SOMOrder-GetDetails').toString();
        serviceUrl = serviceUrl + '?orderNo=' + orderNo;
        orderDetailsSvc.URL = serviceUrl;
        var serviceResult = orderDetailsSvc.call();
        if (serviceResult.ok) {
            var serviceObject = serviceResult.object || null;
            if (serviceObject) {
                var serviceResponse = JSON.parse(serviceObject);
                if (serviceResponse && Object.hasOwnProperty.call(serviceResponse, 'error') && Object.hasOwnProperty.call(serviceResponse, 'msg')) {
                    result.error = serviceResponse.error;
                    result.msg = serviceResponse.msg;
                }
            }
        } else {
            result.error = true;
            result.msg = serviceResult.errorMessage || '';
        }
    } catch (e) {
        result.error = true;
        result.msg = e.toString() + ' in ' + e.fileName + ':' + e.lineNumber;
    }

    return result;
};
