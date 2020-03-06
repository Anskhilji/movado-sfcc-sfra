'use strict';

var server = require('server');

var cache = require('*/cartridge/scripts/middleware/cache');

server.get('Show', cache.applyPromotionSensitiveCache, function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var ProductFactory = require('*/cartridge/scripts/factories/product');
    var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
    var customCategoryHelpers = require('app_custom_movado/cartridge/scripts/helpers/customCategoryHelpers');
    var SmartGiftHelper = require('*/cartridge/scripts/helper/SmartGiftHelper.js');
    
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
        productUrl = URLUtils.url('Product-Show', 'pid', product.id).relative().toString();
        quickViewUrl = URLUtils.url('Product-ShowQuickView', 'pid', product.id)
            .relative().toString();
        var smartGift = SmartGiftHelper.getSmartGiftCardBasket(product.id);
        res.setViewData(smartGift);

    } catch (e) {
        product = false;
        productUrl = URLUtils.url('Home-Show');// TODO: change to coming soon page
        quickViewUrl = URLUtils.url('Home-Show');
    }
    
    var requestQuerystring = {
        pid: product.id
    };
    
    var showProductPageHelperResult = productHelper.showProductPage(requestQuerystring, req.pageMetaData);
    var productCustomHelpers = require('*/cartridge/scripts/helpers/productCustomHelpers');
    var categoryName = productTileParams.categoryName != null ? productTileParams.categoryName : null;
    var wishlistGtmObj = productCustomHelpers.getWishlistGtmObj(product);
    var productClickGtmObj = productCustomHelpers.getGtmProductClickObj(product, categoryName, productTileParams.position);
    var productGtmObj = productCustomHelpers.getProductGtmObj(product, categoryName, productTileParams.position);
    var qvGtmObj = productCustomHelpers.getQVGtmObj(product, categoryName);
    var context = {
        isCompareableDisabled: customCategoryHelpers.isCompareableDisabled(productTileParams.pid),
        product: product,
        apiProduct: showProductPageHelperResult.product,
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
        isTopSearch: req.querystring.isTopSearch
    };

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
    } catch (ex) {
        var YotpoLogger = require('/int_yotpo/cartridge/scripts/yotpo/utils/YotpoLogger');
        YotpoLogger.logMessage('Something went wrong while retrieving ratings and reviews data for current product, Exception code is: ' + ex, 'error', 'Yotpo~Tile-Show');
    }

    res.render('product/gridTile.isml', context);   

    next();
});

module.exports = server.exports();
