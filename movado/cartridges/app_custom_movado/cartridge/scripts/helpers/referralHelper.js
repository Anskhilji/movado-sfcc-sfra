'static';

/**
 * Checks query string for coupon code and appiles coupon to Basket
 * @param {Request} request 
 */
function addReferralCoupon(request) {
    var BasketMgr = require('dw/order/BasketMgr');
    var requestHttpParameterMap = request.getHttpParameterMap();
    if (!empty(requestHttpParameterMap) && !empty(requestHttpParameterMap.get('popup_code').value)) {
        var couponCode = requestHttpParameterMap.get('popup_code').value;
        var currentBasket = BasketMgr.getCurrentOrNewBasket();
        if (couponCode && !empty(couponCode) && !empty(currentBasket)) {
            var appliedCoupon = currentBasket.getCouponLineItem(couponCode);
            if (empty(appliedCoupon)) {
                try {
                    var Transaction = require('dw/system/Transaction');
                    Transaction.wrap(function () { 
                        currentBasket.createCouponLineItem(couponCode, true);
                    });
                } catch (error) {
                    var Logger = require('dw/system/Logger');
                    Logger.error('addReferralCoupon: Error occured while adding couponCode to basket.\n Coupon Code: {0} \n Error Message: {1} \n Stack Trace: {2}', couponCode , error.message, error.stack);
                }
            }
        }
    }
    return;
}

module.exports = {
    addReferralCoupon: addReferralCoupon
}