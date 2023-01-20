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
        params.shippingCost = requestParams.shippingCost;
        params.discount = requestParams.discount;
        params.subTotal = requestParams.subTotal;
        params.grandTotal = requestParams.grandTotal;
        params.creationDate = requestParams.creationDate; 
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

function sendContactToListrak(requestParam) {
    var authServiceID = Constants.SERVICE_ID.LTK_AUTH;
    var serviceID = Constants.SERVICE_ID.LTK_SMS_SUBSCRIPTION;
    try {
        var params = {
            isExpired: false,
            authServiceID: authServiceID
        }
        var accessToken = LTKAPIHelper.getAuthToken(params);
        // var accessToken = 'Xs-6nddfHfN08MN-IUGfsK_D--FkNEb8UoXV5Vq4GpbFsCdidoFh8C-QAoXjXDZO-8h14V0xAifQg28Nh-NUviADJfilNruEJtlN_K258xDwA9f6NGxg16RrOYzeSmP2mEz8BxtNdxPAAbcYyXMv3F36dV5KRRj9rysQObsr32pEb-8PPChKSaZAcKYIBsJ_jVbDW1Fnu1BpSZsHQe-jiNX3m0WvZaI8BNexEDQcX3nIPEVgBO1qgN2QvPTAlj8TANMYlTdb3OVkkRZh6AEhcq8Vz0rf9Pa_yFiIE4vj1IHHTsxeOoV01FbXIZc0nLsl'

        var service = null;

        params.phone = requestParam.phone;
        if (requestParam.email) {
            params.email = requestParam.email;
        }

        service = LTKAPIHelper.getContactStatusAPIService(serviceID, Constants.LTK_GET_CONTACT_STATUS_API_ENDPOINT, accessToken, requestParam.phone);
        var result = LTKAPIHelper.addContactStatusToLTK(params, service);
    } catch (e) {
        Logger.error('Listrak sendContactToListrak: some exception occured while sending SMS Subscription contact - {0}', e.toString());
    }
    return result;
}

function subscribeContactToListrak(requestParam) {
    var authServiceID = Constants.SERVICE_ID.LTK_AUTH;
    var serviceID = Constants.SERVICE_ID.LTK_SMS_SUBSCRIPTION;
    try {
        var params = {
            isExpired: false,
            authServiceID: authServiceID
        }
        var accessToken = LTKAPIHelper.getAuthToken(params);
        var service = null;

        params.phone = requestParam.phone;
        if (requestParam.email) {
            params.email = requestParam.email;
        }

        service = LTKAPIHelper.getSubscribeContactAPIService(serviceID, Constants.LTK_SUBSCRIBE_CONTACT_API_ENDPOINT, accessToken, requestParam.phone);
        var result = LTKAPIHelper.addSubscribeContactToLTK(params, service);
    } catch (e) {
        Logger.error('Listrak sendContactToListrak: some exception occured while sending SMS Subscription contact - {0}', e.toString());
    }
    return result;
}

function createContactToListrak(requestParam) {
    var authServiceID = Constants.SERVICE_ID.LTK_AUTH;
    var serviceID = Constants.SERVICE_ID.LTK_SMS_SUBSCRIPTION;
    try {
        var params = {
            isExpired: false,
            authServiceID: authServiceID
        }
        var accessToken = LTKAPIHelper.getAuthToken(params);
        // var accessToken = 'Xs-6nddfHfN08MN-IUGfsK_D--FkNEb8UoXV5Vq4GpbFsCdidoFh8C-QAoXjXDZO-8h14V0xAifQg28Nh-NUviADJfilNruEJtlN_K258xDwA9f6NGxg16RrOYzeSmP2mEz8BxtNdxPAAbcYyXMv3F36dV5KRRj9rysQObsr32pEb-8PPChKSaZAcKYIBsJ_jVbDW1Fnu1BpSZsHQe-jiNX3m0WvZaI8BNexEDQcX3nIPEVgBO1qgN2QvPTAlj8TANMYlTdb3OVkkRZh6AEhcq8Vz0rf9Pa_yFiIE4vj1IHHTsxeOoV01FbXIZc0nLsl'
        var service = null;

        params.phone = requestParam.phone;
        if (requestParam.email) {
            params.email = requestParam.email;
        }

        service = LTKAPIHelper.getCreateContactAPIService(serviceID, Constants.LTK_CREATE_CONTACT_API_ENDPOINT, accessToken, requestParam.phone);
        var result = LTKAPIHelper.addCreateContactToLTK(params, service);
    } catch (e) {
        Logger.error('Listrak sendContactToListrak: some exception occured while sending SMS Subscription contact - {0}', e.toString());
    }
    return result;
}

module.exports = {
    sendSubscriberToListrak: sendSubscriberToListrak,
    sendTransactionalEmailToListrak: sendTransactionalEmailToListrak,
    sendContactToListrak: sendContactToListrak,
    subscribeContactToListrak: subscribeContactToListrak,
    createContactToListrak: createContactToListrak
}