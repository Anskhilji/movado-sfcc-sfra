'use strict';

var server = require('server');

const cache = require('*/cartridge/scripts/middleware/cache');
const Site = require('dw/system/Site');
const logger = require('dw/system/Logger');
const URLUtils = require('dw/web/URLUtils');
const ProductFactory = require('*/cartridge/scripts/factories/product');
const productHelper = require('*/cartridge/scripts/helpers/productHelpers');
const customCategoryHelpers = require('app_custom_movado/cartridge/scripts/helpers/customCategoryHelpers');
const SmartGiftHelper = require('*/cartridge/scripts/helper/SmartGiftHelper.js');
const productCustomHelper = require('*/cartridge/scripts/helpers/productCustomHelper');
const productCustomHelpers = require('*/cartridge/scripts/helpers/productCustomHelpers');
const YotpoIntegrationHelper = require('/int_yotpo_sfra/cartridge/scripts/common/integrationHelper.js');
const YotpoLogger = require('/int_yotpo/cartridge/scripts/yotpo/utils/YotpoLogger');
const SitePrefrence = Site.getCurrent().preferences.custom;

server.get('Show', cache.applyPromotionSensitiveCache, function (req, res, next) {
    
    // The req parameter has a property called querystring. In this use case the querystring could
    // have the following:
    // pid - the Product ID
    // ratings - boolean to determine if the reviews should be shown in the tile.
    // swatches - boolean to determine if the swatches should be shown in the tile.
    //
    // pview - string to determine if the product factory returns a model for
    //         a tile or a pdp/quickview display
    const productTileParams = { pview: 'tile' };
    Object.keys(req.querystring).forEach(function (key) {
        productTileParams[key] = req.querystring[key];
    });
    
    let product,productUrl,quickViewUrl;

    // TODO: remove this logic once the Product factory is
    // able to handle the different product types
    try {
        product = ProductFactory.get(productTileParams);
        productUrl = URLUtils.url('Product-Show', 'pid', !empty(product) ? product.id : '').relative().toString();
        quickViewUrl = URLUtils.url('Product-ShowQuickView', 'pid', !empty(product) ? product.id : '')
            .relative().toString();
        const smartGift = SmartGiftHelper.getSmartGiftCardBasket(!empty(product) ? product.id : '');
        res.setViewData(smartGift);

    } catch (e) {
        product = false;
        productUrl = URLUtils.url('Home-Show');// TODO: change to coming soon page
        quickViewUrl = URLUtils.url('Home-Show');
        logger.error('Tile-Show: Error occured while getting product: {0} and error is: {1} in {2} : {3}', productTileParams.pid, e.toString(), e.fileName, e.lineNumber);
    }

    let showProductPageHelperResult = '';

    // Process product data
    if (product) {
        showProductPageHelperResult = productHelper.showProductPage({ pid: product.id }, req.pageMetaData);
    }

    showProductPageHelperResult = productHelper.showProductPage({ pid: product.id }, req.pageMetaData);

    const customURL = productCustomHelper.getPLPCustomURL(product);
    const categoryName = productTileParams.categoryName != null ? productTileParams.categoryName : null;
    const wishlistGtmObj = productCustomHelpers.getWishlistGtmObj(product);
    const productClickGtmObj = productCustomHelpers.getGtmProductClickObj(product, categoryName, productTileParams.position);
    const productGtmObj = productCustomHelpers.getProductGtmObj(product, categoryName, productTileParams.position);
    const qvGtmObj = productCustomHelpers.getQVGtmObj(product, categoryName);

    let context = {
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
        restrictAnonymousUsersOnSalesSites: SitePrefrence.restrictAnonymousUsersOnSalesSites,
        ecommerceFunctionalityEnabled: SitePrefrence.ecommerceFunctionalityEnabled,
        tileImageBackground: SitePrefrence.tileImageBackgroundColor ? SitePrefrence.tileImageBackgroundColor : '',
        tileBodyBackground: SitePrefrence.tileBodyBackgroundColor ? SitePrefrence.tileBodyBackgroundColor : '',
        plpProductFamilyName: SitePrefrence.plpProductFamilyName ? SitePrefrence.plpProductFamilyName : false
    };
    
    let viewData = res.getViewData();
    const readyToOrder = showProductPageHelperResult.product.readyToOrder ? showProductPageHelperResult.product.readyToOrder : '';
    viewData.addToCartUrl = showProductPageHelperResult.addToCartUrl ? showProductPageHelperResult.addToCartUrl : '';
    viewData.product = showProductPageHelperResult.product ? showProductPageHelperResult.product : '';
    viewData.isPLPProduct = true;
    viewData.readyToOrder = readyToOrder;
    viewData.ecommerceFunctionalityEnabled = !empty(SitePrefrence.ecommerceFunctionalityEnabled) ? SitePrefrence.ecommerceFunctionalityEnabled : false;
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
            viewData = res.getViewData();
            viewData.yotpoWidgetData = YotpoIntegrationHelper.getRatingsOrReviewsData(session.custom.yotpoConfig, req.querystring.pid);
            res.setViewData(viewData);
        }
        else {
                viewData = res.getViewData();
                const yotpoConfig = YotpoIntegrationHelper.getYotpoConfig(req, viewData.locale);
        
                if (yotpoConfig.isCartridgeEnabled) {
                    viewData.yotpoWidgetData = YotpoIntegrationHelper.getRatingsOrReviewsData(yotpoConfig, req.querystring.pid);
                    res.setViewData(viewData);
                }
        }
    } catch (ex) {
        YotpoLogger.logMessage('Something went wrong while retrieving ratings and reviews data for current product, Exception code is: ' + ex, 'error', 'Yotpo~Tile-Show');
    }

    res.render('product/gridTile.isml', context);   

    next();
});

module.exports = server.exports();
