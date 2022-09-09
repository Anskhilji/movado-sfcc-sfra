'use strict';

var server = require('server');

var cache = require('*/cartridge/scripts/middleware/cache');

server.get('Show', cache.applyPromotionSensitiveCache, function (req, res, next) {
    var Site = require('dw/system/Site');
    var logger = require('dw/system/Logger');
    var URLUtils = require('dw/web/URLUtils');
    var ProductFactory = require('*/cartridge/scripts/factories/product');
    var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
    var customCategoryHelpers = require('app_custom_movado/cartridge/scripts/helpers/customCategoryHelpers');
    var SmartGiftHelper = require('*/cartridge/scripts/helper/SmartGiftHelper.js');
    var productCustomHelper = require('*/cartridge/scripts/helpers/productCustomHelper');
    
    // The req parameter has a property called querystring. In this use case the querystring could
    // have the following:
    // pid - the Product ID
    // ratings - boolean to determine if the reviews should be shown in the tile.
    // swatches - boolean to determine if the swatches should be shown in the tile.
    //
    // pview - string to determine if the product factory returns a model for
    //         a tile or a pdp/quickview display
    var productTileParams = { pview: 'tile' };
    Object.keys(req.querystring).forEach(function (key) {
        productTileParams[key] = req.querystring[key];
    });
    
    var product;
    var productUrl;
    var quickViewUrl;

    // TODO: remove this logic once the Product factory is
    // able to handle the different product types
    try {
        product = ProductFactory.get(productTileParams);
        productUrl = URLUtils.url('Product-Show', 'pid', !empty(product) ? product.id : '').relative().toString();
        quickViewUrl = URLUtils.url('Product-ShowQuickView', 'pid', !empty(product) ? product.id : '')
            .relative().toString();
        var smartGift = SmartGiftHelper.getSmartGiftCardBasket(!empty(product) ? product.id : '');
        res.setViewData(smartGift);

    } catch (e) {
        product = false;
        productUrl = URLUtils.url('Home-Show');// TODO: change to coming soon page
        quickViewUrl = URLUtils.url('Home-Show');
        logger.error('Tile-Show: Error occured while getting product: {0} and error is: {1} in {2} : {3}', productTileParams.pid, e.toString(), e.fileName, e.lineNumber);
    }

    var showProductPageHelperResult = '';
    if (product) {
        var requestQuerystring = {
            pid: product.id
        };
        showProductPageHelperResult = productHelper.showProductPage(requestQuerystring, req.pageMetaData);
    }

    var showProductPageHelperResult = productHelper.showProductPage(requestQuerystring, req.pageMetaData);

    var productCustomHelpers = require('*/cartridge/scripts/helpers/productCustomHelpers');
    var customURL = productCustomHelper.getPLPCustomURL(product);
    var categoryName = productTileParams.categoryName != null ? productTileParams.categoryName : null;
    var wishlistGtmObj = productCustomHelpers.getWishlistGtmObj(product);
    var productClickGtmObj = productCustomHelpers.getGtmProductClickObj(product, categoryName, productTileParams.position);
    var productGtmObj = productCustomHelpers.getProductGtmObj(product, categoryName, productTileParams.position);
    var qvGtmObj = productCustomHelpers.getQVGtmObj(product, categoryName);
    var context = {
        isCompareableDisabled: customCategoryHelpers.isCompareableDisabled(productTileParams.pid),
        product: product,
        apiProduct: !empty(showProductPageHelperResult) ? showProductPageHelperResult.product : '',
        urls: {
            product: productUrl,
            quickView: quickViewUrl
        },
        display: {},
        wishlistGtmObj: wishlistGtmObj,
        productClickGtmObj: productClickGtmObj,
        productGtmObj: productGtmObj,
        qvGtmObj: qvGtmObj,
        loggedIn: req.currentCustomer.raw.authenticated,
        isTopSearch: req.querystring.isTopSearch,
        restrictAnonymousUsersOnSalesSites: Site.getCurrent().preferences.custom.restrictAnonymousUsersOnSalesSites,
        ecommerceFunctionalityEnabled: Site.getCurrent().preferences.custom.ecommerceFunctionalityEnabled,
        tileImageBackground: Site.getCurrent().preferences.custom.tileImageBackgroundColor ? Site.getCurrent().preferences.custom.tileImageBackgroundColor : '',
        tileBodyBackground: Site.getCurrent().preferences.custom.tileBodyBackgroundColor ? Site.getCurrent().preferences.custom.tileBodyBackgroundColor : '',
        plpProductFamilyName: Site.getCurrent().preferences.custom.plpProductFamilyName ? Site.getCurrent().preferences.custom.plpProductFamilyName : false
    };
    
    var viewData = res.getViewData();
    var readyToOrder = showProductPageHelperResult.product.readyToOrder ? showProductPageHelperResult.product.readyToOrder : '';
    viewData.addToCartUrl = showProductPageHelperResult.addToCartUrl ? showProductPageHelperResult.addToCartUrl : '';
    viewData.product = showProductPageHelperResult.product ? showProductPageHelperResult.product : '';
    viewData.isPLPProduct = true;
    viewData.readyToOrder = readyToOrder;
    viewData.ecommerceFunctionalityEnabled = !empty(Site.getCurrent().preferences.custom.ecommerceFunctionalityEnabled) ? Site.getCurrent().preferences.custom.ecommerceFunctionalityEnabled : false;
    viewData.customURL = customURL;

    res.setViewData(viewData);
    Object.keys(req.querystring).forEach(function (key) {
        if (req.querystring[key] === 'true') {
            context.display[key] = true;
        } else if (req.querystring[key] === 'false') {
            context.display[key] = false;
        }
    });
    
    try {
        if (!empty(session.custom.yotpoConfig)) {
            var viewData = res.getViewData();
            var YotpoIntegrationHelper = require('/int_yotpo_sfra/cartridge/scripts/common/integrationHelper.js');
            viewData.yotpoWidgetData = YotpoIntegrationHelper.getRatingsOrReviewsData(session.custom.yotpoConfig, req.querystring.pid);
            res.setViewData(viewData);
        }
        else {
                var viewData = res.getViewData();
                var YotpoIntegrationHelper = require('/int_yotpo_sfra/cartridge/scripts/common/integrationHelper.js');
                var yotpoConfig = YotpoIntegrationHelper.getYotpoConfig(req, viewData.locale);
        
                if (yotpoConfig.isCartridgeEnabled) {
                    viewData.yotpoWidgetData = YotpoIntegrationHelper.getRatingsOrReviewsData(yotpoConfig, req.querystring.pid);
                    res.setViewData(viewData);
                }
        }
    } catch (ex) {
        var YotpoLogger = require('/int_yotpo/cartridge/scripts/yotpo/utils/YotpoLogger');
        YotpoLogger.logMessage('Something went wrong while retrieving ratings and reviews data for current product, Exception code is: ' + ex, 'error', 'Yotpo~Tile-Show');
    }

    res.render('product/gridTile.isml', context);   

    next();
});

module.exports = server.exports();
