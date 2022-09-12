'use strict';

var server = require('server');

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');

var page = module.superModule;
server.extend(page);

server.prepend(
    'Show',
    server.middleware.https,
    consentTracking.consent,
    userLoggedIn.validateLoggedInMCS,
    csrfProtection.generateToken,
    function (req, res, next) {

        next();
    }
);

server.prepend(
    'AddProduct',
    userLoggedIn.validateLoggedInMCS,
    function (req, res, next) {

    next();
});

server.get('MiniCartCheckout', server.middleware.include, function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');

    var currentBasket = BasketMgr.getCurrentBasket();
    var quantityTotal;

    if (currentBasket) {
        quantityTotal = currentBasket.productQuantityTotal;
    } else {
        quantityTotal = 0;
    }

    res.render('/components/header/miniCartCheckout', { quantityTotal: quantityTotal });
    next();
});

server.replace('MiniCartShow', userLoggedIn.validateLoggedInAjaxMCS, function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Transaction = require('dw/system/Transaction');
    var CartModel = require('*/cartridge/models/cart');
    var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
    var reportingUrlsHelper = require('*/cartridge/scripts/reportingUrls');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');

    var currentBasket = BasketMgr.getCurrentBasket();
    var viewData = res.getViewData();
    var reportingURLs;

    if (currentBasket) {
        Transaction.wrap(function () {
            if (currentBasket.currencyCode !== req.session.currency.currencyCode) {
                currentBasket.updateCurrency();
            }
            cartHelper.ensureAllShipmentsHaveMethods(currentBasket);
            basketCalculationHelpers.calculateTotals(currentBasket);
        });
    }

    if (currentBasket && currentBasket.allLineItems.length) {
        reportingURLs = reportingUrlsHelper.getBasketOpenReportingURLs(currentBasket);
    }

    res.setViewData({ reportingURLs: reportingURLs });

    var basketModel = new CartModel(currentBasket);
    var URLUtils = require('dw/web/URLUtils');
    
    if (viewData && viewData.restrictAnonymousUsersOnSalesSites && (viewData.loggedin == false)) {
        res.json({
            loggedin: false,
            restrictAnonymousUsersOnSalesSites: viewData.restrictAnonymousUsersOnSalesSites,
            redirectUrl: viewData.redirectUrl
        });
    } else {
        res.render('checkout/cart/miniCart', basketModel);
    }
    
    next();
});


module.exports = server.exports();
