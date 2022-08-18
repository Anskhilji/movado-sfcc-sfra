'use strict';

var Logger = require('dw/system/Logger').getLogger('Listrak');

var Constants = require('~/cartridge/scripts/utils/ListrakConstants');
var LTKAPIHelper = require('~/cartridge/scripts/helper/ListrakAPIHelper');

function sendSubscriberToListrak(requestParams) {
    var authServiceID = Constants.SERVICE_ID.LTK_AUTH;
    var serviceID = Constants.SERVICE_ID.LTK_EVENT;
    try {
        var params = {
            isExpired: false,
            authServiceID: authServiceID
        }
        var accessToken = LTKAPIHelper.getAuthToken(params);
        var service = null;
        params.source = requestParams.source;
        params.email = requestParams.email;
        params.firstName = requestParams.firstName;
        params.lastName = requestParams.lastName;
        params.birthday = requestParams.birthDate;
        params.birthMonth = requestParams.birthMonth;
        params.countryCode = requestParams.country;

        service = LTKAPIHelper.getAPIService(serviceID, Constants.LTK_API_ENDPOINT.CONTACT, accessToken, requestParams.event, requestParams.subscribe, requestParams.country);
        var result = LTKAPIHelper.addContactToLTK(params, service);
    } catch (e) {
        Logger.error('Listrak sendSubscriberToListrak: some exception occured while exporting subscriber - {0}', e.toString());
    }
    return result;
}

function sendTransactionalEmailToListrak(requestParams) {
    var authServiceID = Constants.SERVICE_ID.LTK_AUTH;
    var serviceID = Constants.SERVICE_ID.LTK_TRANSACTIONAL;
    try {
        var params = {
            isExpired: false,
            authServiceID: authServiceID
        }
        var accessToken = LTKAPIHelper.getAuthToken(params);
        var service = null;

        params.email = requestParams.email;
        params.firstName = requestParams.firstName;
        params.lastName = requestParams.lastName;
        params.password = requestParams.passwordText;
        params.messageContext = requestParams.messageContext;
        params.passwordReset = requestParams.passwordReset;
        params.orderNumber = requestParams.orderNumber;
        params.totalTax = requestParams.totalTax;
        params.shipping = requestParams.shipping;
        params.subTotal = requestParams.subTotal;
        params.totalShippingCost = requestParams.totalShippingCost;
        params.grandTotal = requestParams.grandTotal;
        params.creationDate=  requestParams.creationDate; 
        params.billingFirstName = requestParams.billingFirstName; 
        params.billingLastName = requestParams.billingLastName;
        params.billingAddress1 = requestParams.billingAddress1;
        params.billingAddress2 = requestParams.billingAddress2;
        params.billingCity = requestParams.billingCity;
        params.billingStateCode = requestParams.billingStateCode;       
        params.billingPostalCode = requestParams.billingPostalCode; 
        params.billingCountryCode = requestParams.billingCountryCode; 
        params.billingPhone = requestParams.billingPhone;
        params.shippingFirstName = requestParams.shippingFirstName; 
        params.shippingLastName = requestParams.shippingLastName;
        params.shippingAddress1 = requestParams.shippingAddress1; 
        params.shippingAddress2 = requestParams.shippingAddress2;
        params.shippingCity = requestParams.shippingCity;
        params.shippingStateCode = requestParams.shippingStateCode; 
        params.shippingPostalCode = requestParams.shippingPostalCode;
        params.shippingCountry = requestParams.shippingCountry;
        params.shippingPhone = requestParams.shippingPhone;
        params.shippingMethod = requestParams.shippingMethod;
        params.paymentMethod = requestParams.paymentMethod;
        params.email = requestParams.email;
        params.name = requestParams.name;
        params.productLayout = requestParams.productLayout;
        service = LTKAPIHelper.getTransactionalAPIService(serviceID, Constants.LTK_TRANSACTIONAL_API_ENDPOINT, accessToken, requestParams.messageId);
        var result = LTKAPIHelper.addTransactionalEmailToLTK(params, service);
    } catch (e) {
        Logger.error('Listrak sendTransactionalEmailToListrak: some exception occured while sending Transactional email - {0}', e.toString());
    }
    return result;
}

module.exports = {
    sendSubscriberToListrak: sendSubscriberToListrak,
    sendTransactionalEmailToListrak: sendTransactionalEmailToListrak
}   