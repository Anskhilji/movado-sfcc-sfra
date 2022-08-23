'use strict';

var Site = require('dw/system/Site');
var Constants = require('~/cartridge/scripts/utils/ListrakConstants');

function generateAuthenticationPayLoad(params) {
    var queryParam = "client_id=" + params.clientID + '&client_secret=' + params.clientSecret + '&grant_type=client_credentials';
    return queryParam;
}

function generateAddContactToLTKPayload(params) {
    var payload = {
        "emailAddress": params.email,
        "subscriptionState": Constants.Subscription_State,
        "segmentationFieldValues": [
            {
                "segmentationFieldId": Site.current.preferences.custom.Listrak_FirstName || '',
                "value": params.firstName || ''
            },
            {
                "segmentationFieldId": Site.current.preferences.custom.Listrak_LastName || '',
                "value": params.lastName || ''
            },
            {
                "segmentationFieldId": Site.current.preferences.custom.Listrak_Birthday || '',
                "value": params.birthday || ''
            },
            {
                "segmentationFieldId": Site.current.preferences.custom.Listrak_BirthMonth || '',
                "value": params.birthMonth || ''
            },
            {
                "segmentationFieldId": Site.current.preferences.custom.Listrak_BirthDate || '',
                "value": params.birthMonth && params.birthday ? (params.birthMonth || '')  + Constants.DATE_SEPRATOR + (params.birthday || '') + Constants.DATE_SEPRATOR + Constants.BIRTH_YEAR : ''
            },
            {
                "segmentationFieldId": Site.getCurrent().getCustomPreferenceValue(params.source),
                "value": true
            },
            {
                "segmentationFieldId": Site.current.preferences.custom.Listrak_CountryCode || '',
                "value": params.countryCode || require('*/cartridge/scripts/helpers/productCustomHelper').getCurrentCountry()
            },
            {
                "segmentationFieldId": Site.current.preferences.custom.Listrak_Campaign || '',
                "value": ""
            }
        ]
    };
    return payload;
}

function generateTransactionalEmailToLTKPayload(params) {
    var payload = {
    };
    if (params.messageContext ==  Constants.LTK_ACCOUNT_CONTEXT) {
        payload = {
            "emailAddress": !empty(params.email) ? params.email : '' ,
            "segmentationFieldValues": [
                {
                    "segmentationFieldId": Site.current.preferences.custom.Listrak_Transactional_FirstName || '',
                    "value": params.firstName || params.name || ''
                },
                {
                    "segmentationFieldId": Site.current.preferences.custom.Listrak_Transactional_LastName || '',
                    "value": params.lastName || ''
                },
                {
                    "segmentationFieldId": Site.current.preferences.custom.Listrak_Transactional_Email || '',
                    "value": params.email || ''
                },
                {
                    "segmentationFieldId": Site.current.preferences.custom.Listrak_Transactional_Password || '',
                    "value": params.password || ''
                },
                {
                    "segmentationFieldId": Site.current.preferences.custom.Listrak_Transactional_PasswordResetURL || '',
                    "value": params.passwordReset || ''
                }
            ]
        };
    }

    if (params.messageContext == Constants.LTK_ORDER_CONTEXT) {
        payload = {
            "emailAddress": params.email,
            "segmentationFieldValues": [
                {
                    "segmentationFieldId": Site.current.preferences.custom.Listrak_Transactional_OrderNumber || '',
                    "value": params.orderNumber || ''
                },
                {
                    "segmentationFieldId": Site.current.preferences.custom.Listrak_Transactional_SalesTax || '',
                    "value": params.totalTax || ''
                },
                {
                    "segmentationFieldId": Site.current.preferences.custom.Listrak_Transactional_Subtotal || '',
                    "value": params.subTotal || ''
                },
                {
                    "segmentationFieldId": Site.current.preferences.custom.Listrak_Transactional_Total || '',
                    "value": params.grandTotal || ''
                },
                {
                    "segmentationFieldId": Site.current.preferences.custom.Listrak_Transactional_OrderDate || '',
                    "value": params.creationDate || ''
                },
                {
                    "segmentationFieldId": Site.current.preferences.custom.Listrak_Transactional_BillingFirstName || '',
                    "value": params.billingFirstName || ''
                },
                {
                    "segmentationFieldId": Site.current.preferences.custom.Listrak_Transactional_BillingLastName || '',
                    "value": params.billingLastName || ''
                },
                {
                    "segmentationFieldId": Site.current.preferences.custom.Listrak_Transactional_BillingAddress1 || '',
                    "value": params.billingAddress1 || ''
                },
                {
                    "segmentationFieldId": Site.current.preferences.custom.Listrak_Transactional_BillingAddress2 || '',
                    "value": params.billingAddress2 || ''
                },
                {
                    "segmentationFieldId": Site.current.preferences.custom.Listrak_Transactional_BillingCity || '',
                    "value": params.billingCity || ''
                },
                {
                    "segmentationFieldId": Site.current.preferences.custom.Listrak_Transactional_BillingState || '',
                    "value": params.billingStateCode || ''
                },
                {
                    "segmentationFieldId": Site.current.preferences.custom.Listrak_Transactional_BillingZip || '',
                    "value": params.billingPostalCode || ''
                },
                {
                    "segmentationFieldId": Site.current.preferences.custom.Listrak_Transactional_BillingCountry || '',
                    "value": params.billingCountryCode.value || ''
                },
                {
                    "segmentationFieldId": Site.current.preferences.custom.Listrak_Transactional_ShippingFirstName || '',
                    "value": params.shippingFirstName || ''
                },
                {
                    "segmentationFieldId": Site.current.preferences.custom.Listrak_Transactional_ShippingLastName || '',
                    "value": params.shippingLastName || ''
                },
                {
                    "segmentationFieldId": Site.current.preferences.custom.Listrak_Transactional_BillingPhone || '',
                    "value": params.billingPhone || ''
                },
                {
                    "segmentationFieldId": Site.current.preferences.custom.Listrak_Transactional_ShippingAddress1 || '',
                    "value": params.shippingAddress1 || ''
                },
                {
                    "segmentationFieldId": Site.current.preferences.custom.Listrak_Transactional_ShippingAddress2 || '',
                    "value": params.shippingAddress2 || ''
                },
                {
                    "segmentationFieldId": Site.current.preferences.custom.Listrak_Transactional_ShippingCity || '',
                    "value": params.shippingCity || ''
                },
                {
                    "segmentationFieldId": Site.current.preferences.custom.Listrak_Transactional_ShippingState || '',
                    "value": params.shippingStateCode || ''
                },
                {
                    "segmentationFieldId": Site.current.preferences.custom.Listrak_Transactional_ShippingZip || '',
                    "value": params.shippingPostalCode || ''
                },
                {
                    "segmentationFieldId": Site.current.preferences.custom.Listrak_Transactional_ShippingCountry || '',
                    "value": params.shippingCountry.value || ''
                },
                {
                    "segmentationFieldId": Site.current.preferences.custom.Listrak_Transactional_ShippingPhone || '',
                    "value": params.shippingPhone || ''
                },
                {
                    "segmentationFieldId": Site.current.preferences.custom.Listrak_Transactional_ShippingMethod || '',
                    "value": params.shippingMethod || ''
                },
                {
                    "segmentationFieldId": Site.current.preferences.custom.Listrak_Transactional_PaymentMethod || '',
                    "value": params.paymentMethod || ''
                },
                {
                    "segmentationFieldId": Site.current.preferences.custom.Listrak_Transactional_Email || '',
                    "value": params.email || ''
                },
                {
                    "segmentationFieldId": Site.current.preferences.custom.Listrak_Transactional_ShippingStatus || '',
                    "value": ''
                },
                {
                    "segmentationFieldId": Site.current.preferences.custom.Listrak_Transactional_TrackingURL || '',
                    "value": ''
                },
                {
                    "segmentationFieldId": Site.current.preferences.custom.Listrak_Transactional_TrackingNumber || '',
                    "value": ''
                },
                {
                    "segmentationFieldId": Site.current.preferences.custom.Listrak_Transactional_RefundStatus || '',
                    "value": ''
                },
                {
                    "segmentationFieldId": Site.current.preferences.custom.Listrak_Transactional_YourRefund || '',
                    "value": ''
                },
                {
                    "segmentationFieldId": Site.current.preferences.custom.Listrak_Transactional_RecsSku1 || '',
                    "value": ''
                },
                {
                    "segmentationFieldId": Site.current.preferences.custom.Listrak_Transactional_RecsSku2 || '',
                    "value": ''
                },
                {
                    "segmentationFieldId": Site.current.preferences.custom.Listrak_Transactional_ShippingHandling || '',
                    "value": params.shippingCost || ''
                }
            ]
        };
    } 
    return payload;
}

module.exports = {
    generateAuthenticationPayLoad: generateAuthenticationPayLoad,
    generateAddContactToLTKPayload: generateAddContactToLTKPayload,
    generateTransactionalEmailToLTKPayload:generateTransactionalEmailToLTKPayload
}