'use strict';

/**
* This is the controller called by the Reviews widget to load reviews from Yotpo in real time.
* The response is cached for performance requirements.
*
* @module controllers/Yotpo
*/

var server = require('server');

/**
 * The controller to retrieve reviews in real time from Yotpo
 */
server.get('ImportReviews', function (req, res, next) {
    var yotpoResponseHTML = '';

    try {
        var ImportReviewModel = require('/int_yotpo/cartridge/scripts/yotpo/model/reviewspayload/ImportReviewModel.js');
        var YotpoUtils = require('/int_yotpo/cartridge/scripts/yotpo/utils/YotpoUtils.js');
        var viewData = res.getViewData();

        var currentLocaleID = YotpoUtils.getCurrentLocaleMFRA(viewData.locale);
        yotpoResponseHTML = ImportReviewModel.importReviewsAndRatings(req.querystring.productid, req.querystring.yotporeviewspage, req.querystring.isreview, currentLocaleID);
    } catch (ex) {
        var YotpoLogger = require('/int_yotpo/cartridge/scripts/yotpo/utils/YotpoLogger.js');
        YotpoLogger.logMessage('Something went wrong while importing reviews and ratings, Exception code is: ' + ex, 'error', 'Yotpo~ImportReviews');
    }

    res.render('util/yotporeviewsresponse', {
        yotpoReviewsHTML: yotpoResponseHTML
    });

    next();
});

/**
 * This controller is invoked to track logged in customer and basket for Yotpo Swell loyalty
 */
server.get('IncludeSwellTracking', function (req, res, next) {
    var CommonModel = require('int_yotpo/cartridge/scripts/yotpo/model/common/CommonModel');
    var YotpoUtils = require('/int_yotpo/cartridge/scripts/yotpo/utils/YotpoUtils.js');
    var viewData = res.getViewData();

    var currentLocaleID = YotpoUtils.getCurrentLocaleMFRA(viewData.locale);

    var customerDetails = {
        customerExists: false
    };

    var basketDetails = {
        basketExists: false
    };

    if (req.currentCustomer.profile) {
        customerDetails = CommonModel.getLoggedInCustomerDetails(req.currentCustomer.profile.customerNo);
        basketDetails = CommonModel.getCurrentBasketDetails(currentLocaleID);
    }

    res.render('/tracking/yotposwelltracking', {
        customerDetails: customerDetails,
        basketDetails: basketDetails
    });

    return next();
});

module.exports = server.exports();
