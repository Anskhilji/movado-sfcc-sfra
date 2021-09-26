var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');
var collections = require('*/cartridge/scripts/util/collections');
var constants = require('*/cartridge/scripts/helpers/constants');
var hooksHelper = require('*/cartridge/scripts/helpers/hooks');

function Handle(basket, paymentInformation) {
    Transaction.wrap(function () {
        collections.forEach(basket.getPaymentInstruments(), function (item) {
            basket.removePaymentInstrument(item);
        });

        var paymentInstrument = basket.createPaymentInstrument(
            constants.GOOGLE_PAY_PAYMENT_METHOD, basket.totalGrossPrice
        );
        paymentInstrument.setCreditCardNumber(paymentInformation.info.cardDetails);
        paymentInstrument.setCreditCardType(paymentInformation.info.cardNetwork);
        paymentInstrument.custom.googlePayToken = paymentInformation.tokenizationData.token;
    });

    return { error: false };
}

function Authorize(orderNumber, paymentInstrument, paymentProcessor) {
    var OrderMgr = require('dw/order/OrderMgr');
    var order = OrderMgr.getOrder(orderNumber);
    var result = hooksHelper('app.payment.adyen.googlePay', 'googlePayCheckout', order, paymentInstrument.custom.googlePayToken, paymentInstrument,
        require('*/cartridge/scripts/hooks/payment/adyenGooglePayCheckout').googlePayCheckout);
    
    if (result.error) {
            var errors = [];
            errors.push( Resource.msg('error.technical', 'checkout', null));
            return {
                authorized: false, fieldErrors: [], serverErrors: errors, error: true
            };
    } else {
        Transaction.wrap(function () {
            paymentInstrument.paymentTransaction.setPaymentProcessor(paymentProcessor);
        })
        return { authorized: true, error: false };
    }
}


exports.Handle = Handle;
exports.Authorize = Authorize;
