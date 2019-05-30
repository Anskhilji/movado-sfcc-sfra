/**
 * An object containing information about the payment (the fields are dependant on the payment type - credit card / paypal).
 * @param {*} order
 * @param {*} paymentParams
 * @param {*} checkoutDeniedParams
 * @link http://apiref.riskified.com/curl/#models-payment-details
 */
function create(order, paymentParams, checkoutDeniedParams) {
    var ordPaymInstIt,
        orderPaymInstrument,
        paymentDetails = {};

    var RCUtilities = require('~/cartridge/scripts/riskified/util/RCUtilities');

    var regex = "([\"\'\\\/])";
    var regExp = new RegExp(regex, 'gi');

    ordPaymInstIt = order.getPaymentInstruments().iterator();

    while (ordPaymInstIt.hasNext()) {
        orderPaymInstrument = ordPaymInstIt.next();
        
        if (orderPaymInstrument.paymentMethod.equals(dw.order.PaymentInstrument.METHOD_GIFT_CERTIFICATE)) {
            paymentDetails = {
                /* Reserved for Gift certificates workflow */
            };
        }

        if (orderPaymInstrument.paymentMethod.equals(dw.order.PaymentInstrument.METHOD_CREDIT_CARD)) {
            paymentDetails = {
                avs_result_code     : RCUtilities.escape(paymentParams.avsResultCode, regExp, '', true),
                credit_card_bin     : RCUtilities.escape(paymentParams.cardIIN, regExp, '', true),
                credit_card_company : RCUtilities.escape(orderPaymInstrument.creditCardType, regExp, '', true),
                credit_card_number  : RCUtilities.escape(orderPaymInstrument.maskedCreditCardNumber, regExp, '', true),
                cvv_result_code     : RCUtilities.escape(paymentParams.cvvResultCode, regExp, '', true)
            };
            break;
        }
        if (orderPaymInstrument.paymentMethod == 'PayPal' || (orderPaymInstrument.paymentMethod == 'Adyen' && paymentParams.paymentMethod == 'PayPal')) {
            paymentDetails = {
                authorization_id       : RCUtilities.escape(paymentParams.authorizationID, regExp, '', true),
                payer_email            : RCUtilities.escape(paymentParams.payerEmail, regExp, '', true),
                payer_status           : RCUtilities.escape(paymentParams.payerStatus, regExp, '', true),
                payer_address_status   : RCUtilities.escape(paymentParams.payerAddressStatus, regExp, '', true),
                protection_eligibility : RCUtilities.escape(paymentParams.protectionEligibility, regExp, '', true),
                payment_status         : RCUtilities.escape(paymentParams.paymentStatus, regExp, '', true),
                pending_reason         : RCUtilities.escape(paymentParams.pendingReason, regExp, '', true)
            };
            break;
        }
    }

    // For checkoutDenied fill the authorization_error section
    if (checkoutDeniedParams) {
        paymentDetails.authorization_error = {
            created_at : checkoutDeniedParams.createdAt,
            error_code : RCUtilities.escape(checkoutDeniedParams.authErrorCode, regExp, '', true),
            message    : RCUtilities.escape(checkoutDeniedParams.authErrorMsg, regExp, '', true)
        };
    }

    return paymentDetails;
}

exports.create = create;
