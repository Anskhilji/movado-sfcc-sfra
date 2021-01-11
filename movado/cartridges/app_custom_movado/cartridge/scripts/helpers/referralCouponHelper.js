'static';

/**
 * Checks query string for coupon code and appiles coupon to Basket
 * @param {Request} request 
 */
function addRefrralCoupon(request) {
    var BasketMgr = require('dw/order/BasketMgr');
    var requestHttpParameterMap = request.getHttpParameterMap();
    if (!empty(requestHttpParameterMap) && !empty(requestHttpParameterMap.get('refrralCouponCode'))) {
        var refrralCouponCode = requestHttpParameterMap.get('refrralCouponCode').value;
        var currentBasket = BasketMgr.getCurrentOrNewBasket();
        if (refrralCouponCode && !empty(refrralCouponCode) && !empty(currentBasket)) {
            var appliedCoupon = currentBasket.getCouponLineItem(refrralCouponCode);
            if (empty(appliedCoupon)) {
                try {
                    var Transaction = require('dw/system/Transaction');
                    Transaction.wrap(function () { 
                        currentBasket.createCouponLineItem(refrralCouponCode, true);
                    });
                } catch (error) {
                    var Logger = require('dw/system/Logger');
                    Logger.error('addRefrralCoupon: Error occured while adding refrralCouponCode to basket.\n Coupon Code: {0} \n Error Message: {1} \n Stack Trace: {2}', refrralCouponCode , error.message, error.stack);
                }
            }
        }
    }
    return;
}

module.exports = {
    addRefrralCoupon: addRefrralCoupon
}