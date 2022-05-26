'use strict';
var Site = require('dw/system/Site');
var CatalogMgr = require('dw/catalog/CatalogMgr');
var collections = require('*/cartridge/scripts/util/collections');
var pageNameJSON = JSON.parse(Site.current.getCustomPreferenceValue('pageNameJSON'));
var productFactory = require('*/cartridge/scripts/factories/product');
var Resource = require('dw/web/Resource');
var Encoding = require('dw/crypto/Encoding');
var stringUtils = require('*/cartridge/scripts/helpers/stringUtils');
var googleAnalyticsHelpers = require('*/cartridge/scripts/helpers/googleAnalyticsHelpers');
var URLUtils = require('dw/web/URLUtils');
var Constants = require('*/cartridge/scripts/helpers/utils/Constants');
var searchCustomHelper = require('*/cartridge/scripts/helpers/searchCustomHelper');

var ArrayList = require('dw/util/ArrayList');

var Logger = require('dw/system/Logger');
var formatMoney = require('dw/util/StringUtils').formatMoney;

/**
 * GTM class that represents the data to be supplied to Google Tag Manager
 * @param {Object} req - request object
 * @constructor
 */
function gtmModel(req) {
    var currentCustomer = req.currentCustomer;
    var reqQueryString = req.querystring;
    var action = req.querystring.urlAction.toLowerCase();
    // Custom start: Added referral Url
    var referralUrl = req.referer;
    // Custom end
    var pageUrl = URLUtils.url(action);
    var searchkeyword;
    var cgid;
    var pid;
    var searchCount;
    var productObj;
    var productBreadcrumbs;
    this.primarySiteSection = '';
    this.secondarySiteSection = '';
    this.tertiarySiteSection = '';
    this.searchTerm = '';
    this.googleAnalyticsParameters = '';
    this.customerIPAddressLocation = '';
    this.rakutenAllowedCountries =  [];

    if (req.querystring != undefined) {
        var queryString = req.querystring.urlQueryString;
        var searchQuery = getSearchQuery(queryString);
        // Custom Start : get google analytics arrat from site prefrence
        var googleAnalyticsParameters = getGoogleAnalyticsParameters(queryString, googleAnalyticsHelpers.getGoogleAnalyticsParameters());
        // Custom End
        searchkeyword = searchQuery.q;
        cgid = searchQuery.cgid;
        pid = searchQuery.pid;
    }
    if (action.equals('cart-show') || reqQueryString.urlAction.indexOf('Checkout') > -1) {
        this.checkout = [];
        getCartJSONArray(this.checkout);
        if (action.equals('checkout-login')) {
            this.checkoutAction = 'checkout';
            checkoutStage = 1;
        } else {
            var checkoutActionObject = getCheckoutQueryString(reqQueryString.urlQueryString).stage;
            var checkoutStage = '';
            switch (checkoutActionObject) {
            case 'shipping':
                checkoutStage = 2;
                break;
            case 'payment':
                checkoutStage = 3;
                break;
            case 'placeOrder':
                checkoutStage = 4;
                break;
            }
        }
        this.checkoutStage = checkoutStage;
    }

    // get page Type
    var pageType = escapeHyphon(getPageType(action, searchkeyword, this.checkoutAction));

    // login status of user
    var loginStatus = getLoginStatus(currentCustomer);

    // locale
    var currentLocale = getCurrentLocale(req);

    // language
    var language = currentLocale.language ? currentLocale.language : 'en_us';

    // tenant
    var tenant = getTenant(language); 

    if (pid != null) {
        var ProductMgr = require('dw/catalog/ProductMgr');
        productObj = ProductMgr.getProduct(formatProductId(pid));
        productBreadcrumbs = getProductBreadcrumb(productObj);
        var primarySiteSection = escapeQuotes(productBreadcrumbs.primaryCategory);
        var secoundarySiteSection = escapeQuotes(productBreadcrumbs.secondaryCategory);
        secoundarySiteSection = (!empty(secoundarySiteSection)) ? '|' + secoundarySiteSection : '';

        // get product impressions tags for PDP
        var productImpressionTags = getPDPProductImpressionsTags(productObj);
        this.product = {
            productID: productImpressionTags.productID,
            productName: stringUtils.removeSingleQuotes(productImpressionTags.productName),
            brand: productImpressionTags.brand,
            productPersonalization: productImpressionTags.productPersonalization,
            category: primarySiteSection,
            productPrice: productImpressionTags.productPrice,
            list: productImpressionTags.list,
            currency: productImpressionTags.currency,
            // Custom start: Added secoundary category if exist and quantity on product on pdp
            deparmentIncludedCategoryName: primarySiteSection + secoundarySiteSection,
            quantity: '1'
            // Custom End
        };
    } else if (searchkeyword != null) {
        // search count
        searchCount = (getProductSearch(req, searchQuery).count) != 0 ? (getProductSearch(req, searchQuery).count) : '';
        this.searchTerm = (searchkeyword != null && searchkeyword != undefined) ? stringUtils.removeSingleQuotes(searchkeyword) : '';

        var searchQuery = { q: searchkeyword };
        var productArray = getSearchResultProducts(req, searchQuery);
        if (productArray == 0) {
            searchCount = 0;
        }
        if (searchCount == 0 && pageNameJSON != null) {
            pageType = pageNameJSON['no-searchresult-page'];
        }
    }

    if (action.equals('order-confirm')) {
        var orderId = getOrderIDfromQueryString(queryString);
        this.orderConfirmation = [];
        getOrderConfirmationArray(this.orderConfirmation, orderId);
    }

    var customerIPAddressLocation = !empty(request.geolocation.countryCode) ? request.geolocation.countryCode : '';
    var isRakutenEnabled = !empty(Site.current.preferences.custom.isRakutenEnable) ? Site.current.preferences.custom.isRakutenEnable : false;
    this.rakutenAllowedCountries = new ArrayList(!empty(Site.current.preferences.custom.rakutenAllowedCountries) ? Site.current.preferences.custom.rakutenAllowedCountries : '').toArray();
   
    this.rakutenAllowedCountries = isRakutenEnabled ? this.rakutenAllowedCountries.toString() : '';
    this.pageUrl = pageUrl != null ? pageUrl : '';
    this.action = action != null ? action : '';
    this.referralUrl = referralUrl != null ? referralUrl : '';
    this.tenant = (tenant != null && tenant != undefined) ? tenant : '';
    this.language = (language != null && language != undefined) ? language : '';
    this.pageType = (pageType != null && pageType != undefined) ? pageType : '';
    this.loginStatus = (loginStatus != null && loginStatus != undefined) ? loginStatus : '';
    this.searchCount = (searchCount != null && searchCount != undefined) ? searchCount : '';
    this.googleAnalyticsParameters = googleAnalyticsParameters != null ? googleAnalyticsParameters : '';
    this.customerIPAddressLocation = customerIPAddressLocation || '';
}


/**
 * Function return pageType on the basis of page action
 * @param action
 * @returns pageName
 */
function getPageType(action, searchKeyword, checkoutStage) {
    var pageName = '';
    if (pageNameJSON != null) {
        pageName = pageNameJSON[action];

        switch (checkoutStage) {
            case 'shipping':
                pageName = pageNameJSON['checkout-shipping'];
                break;
            case 'payment':
                pageName = pageNameJSON['checkout-billing'];
                break;
            case 'placeOrder':
                pageName = pageNameJSON['checkout-placeorder'];
                break;
        }

        if (action.equals('search-show') && searchKeyword == undefined) {
            pageName = pageNameJSON['product-listing'];
        }
    }

    return pageName;
}

/**
 * Return if user is logged-in or guest
 * @param currentCustomer
 * @returns loginStatus
 */
function getLoginStatus(currentCustomer) {
    var userStatus = 'Guest';
    if (currentCustomer.raw.authenticated) {
        userStatus = 'logged in';
    }
     return userStatus;
}

/**
 * Function returns locale
 * @param req
 * @returns
 */
function getCurrentLocale(req) {
    var Locale = require('dw/util/Locale');
    var localObj = Locale.getLocale(req.locale.id);
    if (localObj != undefined && localObj.ID != '') {
        return Locale.getLocale(req.locale.id);
    }

    return req.locale.id;
}

function getTenant(currentLocale) {
    var gtmTenantJSON = JSON.parse(Site.current.getCustomPreferenceValue('gmtTenantJSON'));
    var tenant = '';
    tenant = gtmTenantJSON[currentLocale.toLowerCase()];
    return tenant;
}

/**
 *
 * @param queryStringVal
 * @returns searchQuery
 */
function getSearchQuery(queryStringVal) {
    try {
        var searchArray = [];
        var searchQuery = '';
        var queryString = queryStringVal ? Encoding.fromURI(queryStringVal) : '';
        if (queryString.indexOf('&') >= 0) {
            searchArray = queryString.split('&');
            searchArray = searchArray[1].split('=');
            if ((searchArray[0].indexOf('q')) > -1) {
                searchQuery = { q: searchArray[1] };
            } else if ((queryString.indexOf('pid')) > -1) {
                searchArray = queryString.split('&');
                var productID;
                for (var index = 0; index < searchArray.length; index++) {
                    if (searchArray[index].indexOf('pid=') > -1) {
                        productID = searchArray[index];
                        break;
                    }
                }
                searchArrayQuery = productID ? productID.split('=') : '';
                searchQuery = { pid: searchArrayQuery[1] };
            }
        } else if ((queryString.indexOf('pid')) > -1) {
            searchArray = queryString.split('=');
            searchQuery = { pid: searchArray[1] };
        } else if ((queryString.indexOf('cgid')) > -1) {
            searchArray = queryString.split('=');
            searchQuery = { cgid: searchArray[1] };
        } else if ((queryString.indexOf('q')) > -1) {
            searchArray = queryString.split('=');
            searchQuery = { q: searchArray[1] };
        }
        return searchQuery;
    } catch (ex) {
        Logger.error('Error occured while getting search query for gtm. Error: {0} \n Stack: {1} \n', ex.message, ex.stack);
        return '';
    }
}


/**
 *
 * @param queryString
 * @returns checkoutStage
 */
function getCheckoutQueryString(reqQueryString) {
    var stage = '';
    if ((reqQueryString.indexOf('stage')) > -1) {
        queryParamArray = reqQueryString.split('=');
        stage = { stage: queryParamArray[1] };
    }
    return stage;
}
/**
 * Funtion return search count based of the search keyword
 * @param searchKeyword
 * @returns
 */
function getProductSearch(req, queryString) {
    var ProductSearchModel = require('dw/catalog/ProductSearchModel');
    var ProductSearch = require('*/cartridge/models/search/productSearch');
    var searchHelper = require('*/cartridge/scripts/helpers/searchHelpers');
    var apiProductSearch = new ProductSearchModel();

    if (queryString != undefined) {
         apiProductSearch = searchHelper.setupSearch(apiProductSearch, queryString);
        apiProductSearch.search();
        var categoryTemplate = searchHelper.getCategoryTemplate(apiProductSearch);
        var productSearch = new ProductSearch(
                     apiProductSearch,
                     queryString,
                     req.querystring.srule,
                     CatalogMgr.getSortingOptions(),
                     CatalogMgr.getSiteCatalog().getRoot()
             );
             return productSearch;
    }

    return '';
}

/**
 *
 * @param productObj
 * @returns productBreadcrumb
 */
function getProductBreadcrumb(productObj) {
    var category = productObj.variant && !!productObj.masterProduct.primaryCategory
    ? productObj.masterProduct.primaryCategory
    : productObj.primaryCategory;
    var categoryHierarchy = searchCustomHelper.getCategoryBreadcrumb(category);
    return { primaryCategory: categoryHierarchy.primaryCategory, secondaryCategory: categoryHierarchy.secondaryCategory, tertiaryCategory: categoryHierarchy.tertiaryCategory  };
}


/**
 *
 * @param queryString
 * @returns categoryId
 */
function getCategory(req, categoryQuery) {
    var CatalogMgr = require('dw/catalog/CatalogMgr');
    var productSearch = getProductSearch(req, categoryQuery);
    var category = CatalogMgr.getCategory(productSearch.category.id);

    return category;
}

/**
 *
 * @param queryString
 * @returns categoryId
 */
function getSearchResultProducts(req, searchQuery) {
    var searchHelper = require('*/cartridge/scripts/helpers/searchHelpers');
    var ProductSearchModel = require('dw/catalog/ProductSearchModel');
    var ProductSearch = require('*/cartridge/models/search/productSearch');
    var ProductManager = require('dw/catalog/ProductMgr');
    var apiProductSearch = new ProductSearchModel();
    var productSearch = getProductSearch(req, searchQuery);
    apiProductSearch = searchHelper.setupSearch(apiProductSearch, searchQuery);
    apiProductSearch.search();
    var categoryTemplate = searchHelper.getCategoryTemplate(apiProductSearch);
    var productSearch = new ProductSearch(
                 apiProductSearch,
                 searchQuery,
                 req.querystring.srule,
                 CatalogMgr.getSortingOptions(),
                 CatalogMgr.getSiteCatalog().getRoot()
            );
    return productSearch.count;
}

/**
 *
 * @param productObj
 * @returns
 */
function getPDPProductImpressionsTags(productObj) {
    var productID = productObj.ID;
    var productName = stringUtils.removeSingleQuotes(productObj.name);
    var brand = productObj.brand;
    var productPersonalization = '';
    var productModel = productFactory.get({pid: productID});
    var productPrice = productModel.price && productModel.price.sales ? productModel.price.sales.decimalPrice : (productModel.price && productModel.price.list ? productModel.price.list.decimalPrice : '');
    var currency = (productObj.priceModel.price.available ? (productObj.priceModel.price.currencyCode) : (productObj.priceModel.minPrice.currencyCode));

    var prodOptionArray = getProductOptions(productObj.optionModel.options);

    productPersonalization = prodOptionArray != null ? prodOptionArray : '';
    return { productID: productID, productName: productName, brand: brand, productPersonalization: productPersonalization, productPrice: productPrice, list: 'PDP', currency: currency };
}


/**
 *
 * @param categoryObj
 * @returns
 */
function getBasketParameters() {
    var BasketMgr = require('dw/order/BasketMgr');
    var TotalsModel = require('*/cartridge/models/totals');
    var currentBasket = BasketMgr.getCurrentBasket();
    //Custom start: get total product quantity 
    var productQuantityTotal = currentBasket.productQuantityTotal;
    // Custom End
    var totalsModel = new TotalsModel(currentBasket);
    var currencyCode = currentBasket.currencyCode;
    var cartJSON = [];
    if (currentBasket) {
        var cartItems = currentBasket.allProductLineItems;
        var appliedCoupons = getCouponsOnOrder(currentBasket.couponLineItems);
        var countryDisplayName = (currentBasket.billingAddress) ? currentBasket.billingAddress.countryCode.displayValue : '';
        var paymentMethod = (currentBasket.paymentInstrument != null) ? currentBasket.paymentInstrument.paymentMethod : '';
        // Custom Start : Added city state zip code with pipe bars
        var cityStateZipCode = (currentBasket.billingAddress) ? currentBasket.billingAddress.city + Constants.MOVADO_SHIPPING_PIPE_BARS + currentBasket.billingAddress.stateCode + Constants.MOVADO_SHIPPING_PIPE_BARS + currentBasket.billingAddress.postalCode: '';
        // Custom End
        collections.forEach(cartItems, function (cartItem) {
            if (cartItem.product != null && cartItem.product.optionModel != null) {
                var variants = getVariants(cartItem);
                var productModel = productFactory.get({pid: cartItem.productID});
                var productPrice = productModel.price && productModel.price.sales ? productModel.price.sales.decimalPrice : (productModel.price && productModel.price.list ? productModel.price.list.decimalPrice : '');
                cartJSON.push({
                    id: cartItem.productID,
                    name: stringUtils.removeSingleQuotes(cartItem.productName),
                    brand: cartItem.product.brand,
                    category: cartItem.product.variant && !!cartItem.product.masterProduct.primaryCategory ? cartItem.product.masterProduct.primaryCategory.ID : (cartItem.product.primaryCategory ? cartItem.product.primaryCategory.ID : ''),
                    variant: variants,
                    price: productPrice,
                    revenue: cartItem.grossPrice.decimalValue,
                    tax: cartItem.tax.decimalValue,
                    shipping: cartItem.shipment.shippingTotalGrossPrice.decimalValue,
                    coupon: appliedCoupons,
                    quantity: cartItem.quantity.decimalValue,
                    totalProductQuantity: productQuantityTotal,
                    cityStateZipCode: cityStateZipCode,
                    currency: currencyCode,
                    cityStateZip: cityStateZipCode,
                    country: countryDisplayName,
                    // Custom Start : Added product discount
                    discount: getOrderLevelDiscount(cartItem),
                    subTotal: totalsModel.subTotal,
                    orderlevelDiscount: totalsModel.orderLevelDiscountTotal.value,
                    // Custom End
                    // Custom Start : Added payment method
                    paymentMethod: paymentMethod });
            }       // Custom End
        });
    }
    return cartJSON;
}

/**
 *
 * @returns array of cart json
 */
function getCartJSONArray(checkoutObject) {
    var cartJSON = getBasketParameters();
    var cartArray = [];

    for (var i = 0; i < cartJSON.length; i++) {
        var cartObj = {};
        cartObj.id = cartJSON[i].id;
        cartObj.name = stringUtils.removeSingleQuotes(cartJSON[i].name);
        cartObj.price = cartJSON[i].price;
        cartObj.brand = cartJSON[i].brand;
        cartObj.category = escapeQuotes(cartJSON[i].category);
        cartObj.variant = cartJSON[i].variant;
        cartObj.position = cartJSON[i].position;
        cartObj.revenue = cartJSON[i].revenue;
        cartObj.tax = cartJSON[i].tax;
        cartObj.shipping = cartJSON[i].shipping;
        cartObj.coupon = (!empty(cartJSON[i].coupon)) ? cartJSON[i].coupon : 0;
        cartObj.orderlevelDiscount = cartJSON[i].orderlevelDiscount;
        // Custom Start : Added product quantity into cart Object
        cartObj.productQuantity = cartJSON[i].quantity;
        // Custom End
        cartObj.totalProductQuantity = cartJSON[i].totalProductQuantity;
        cartObj.currency = cartJSON[i].currency;
        // Custom Start : Added country into cart object
        cartObj.country = cartJSON[i].country;
        // Custom End
        cartObj.cityStateZipCode = cartJSON[i].cityStateZip;
        // Custom Start : Added subtotal
        cartObj.subTotal = cartJSON[i].subTotal;
        // Custom End
        // Custom Start : Added discount
        cartObj.discount = cartJSON[i].discount;
        // Custom End
        cartObj.paymentMethod = cartJSON[i].paymentMethod;

        if (cartArray.length < 10) {
            cartArray.push({
                cartObj: cartObj
            });
        } else {
            checkoutObject.push(cartArray);
            cartArray = [];
            cartArray.push({
                cartObj: cartObj
            });
        }
    }
    checkoutObject.push(cartArray);
}

/**
 *
 * @param productOptions
 * @returns productOption
 */
function getProductOptions(productOptions) {
    var prodOptionArray;
    if (productOptions.empty != true) {
        collections.forEach(productOptions, function (productOption) {
            if (prodOptionArray == undefined) {
                prodOptionArray = productOption.ID;
            } else {
                prodOptionArray += ',' + productOption.ID;
            }
        });
    }
    return prodOptionArray;
}

/**
 *
 * @param product
 * @returns variants
 */
function getVariants(product) {
    var variant = '';
    var productVariants = [];
    if (product.custom.GiftWrapMessage) {
        productVariants.push(Resource.msg('text.personalization.giftWrapping', 'gtm', null));
             }
         if (product.custom.embossMessageLine1 != null) {
             productVariants.push(Resource.msg('text.personalization.embossed', 'gtm', null));
         }
         if (product.custom.engraveMessageLine1 != null) {
             productVariants.push(Resource.msg('text.personalization.engraved', 'gtm', null));
         }
             for (var i = 0; i < productVariants.length; i++) {
                 if (variant == '') {
                     variant = productVariants[i];
                 } else {
                     variant = variant + ',' + productVariants[i];
                 }
             }

    return variant;
}

/**
 * Function to escape quotes
 * @param value
 * @returns escape quote value
 */
function escapeQuotes(value) {
    if (value != null) {
        return value.replace(/'/g, "\\'");
    }
    return value;
}

/**
 * Function to escape quotes
 * @param value
 * @returns escape quote value
 */
function escapeHyphon(value) {
    if (value != null) {
        return value.replace(/ –/g, '\\ -');
    }
    return value;
}

/**
 *
 * @param couponList
 * @returns applied coupons-comma separated  on order
 */
function getCouponsOnOrder(couponList) {
    var coupons;
    collections.forEach(couponList, function (coupon) {
        if (coupons == undefined) {
            coupons = coupon.couponCode;
        } else {
            coupons += ',' + coupon.couponCode;
        }
    });
    return coupons != null ? coupons : '';
}

/**
 *
 * @returns order parameters
 */
function getOrderParameters(orderId) {}

/**
 *
 * @param queryString
 * @returns orderId
 */
function getOrderIDfromQueryString(queryString) {
    var orderTokenArray = queryString.split('&');
    var orderToken = orderTokenArray[0].split('=');
    return orderToken[1];
}

/**
 *
 * @param orderId
 * @returns orderConfirmationJSONArray
 */
function getOrderConfirmationArray(gtmorderConfObj, orderId) {
    var order = require('dw/order/Order');
    var OrderMgr = require('dw/order/OrderMgr');
    var order = OrderMgr.getOrder(orderId);
    var paymentMethod = '';

    if (order != null && order.productLineItems != null) {
        var orderLevelCouponString = 0;
        var itemLevelCouponString = '';
        var orderSubTotal;
        var orderLevelPromotionPrice;
        paymentMethod = order.paymentInstrument.paymentMethod;
        orderLevelPromotionPrice = (order.priceAdjustments.empty == false) ? order.priceAdjustments.iterator(): null;
        orderSubTotal = order.getAdjustedMerchandizeTotalPrice(false);
        orderSubTotal = formatMoney(orderSubTotal);
        if (orderLevelPromotionPrice && orderLevelPromotionPrice.hasNext()) {
            var priceAdjustmentLineItem = orderLevelPromotionPrice.next();
            orderLevelPromotionPrice = priceAdjustmentLineItem.priceValue * -1;
        }
        collections.forEach(order.couponLineItems, function (couponLineItem) {
            collections.forEach(couponLineItem.priceAdjustments, function (priceAdjustment) {
                if (priceAdjustment.promotion.promotionClass == 'ORDER') {
                    orderLevelCouponString = getCouponsOnOrder(order.couponLineItems);
                    orderLevelCouponString = (!empty(orderLevelCouponString)) ? orderLevelCouponString : 0;
                } else if (priceAdjustment.promotion.promotionClass == 'PRODUCT') {
                    itemLevelCouponString = getCouponsOnOrder(order.couponLineItems);
                }
            });
        });

        var orderJSONArray = [];
        collections.forEach(order.productLineItems, function (productLineItem) {
            var variants = getVariants(productLineItem);
            var produtObj = {};

            produtObj.id = productLineItem.product.ID;
            produtObj.name = stringUtils.removeSingleQuotes(productLineItem.product.name);
            produtObj.brand = productLineItem.product.brand;
            produtObj.category = escapeQuotes(productLineItem.product.variant ? ((productLineItem.product.masterProduct != null && productLineItem.product.masterProduct.primaryCategory != null) ? productLineItem.product.masterProduct.primaryCategory.ID
                : '')
                : ((productLineItem.product.primaryCategory != null) ? productLineItem.product.primaryCategory.ID : ''));
            produtObj.variant = variants;
            if (orderLevelPromotionPrice) {
                var discountedPrice = orderLevelPromotionPrice / order.productLineItems.length;
                var actualPrice = productLineItem.getAdjustedNetPrice().getDecimalValue() - discountedPrice;
                produtObj.price = actualPrice.toString();
            } else {
                produtObj.price = productLineItem.getAdjustedNetPrice().getDecimalValue().toString();
            }
            produtObj.unitBasePrice = productLineItem.basePrice.decimalValue.toString();
            produtObj.unitPriceLessTax = (productLineItem.basePrice.decimalValue + productLineItem.tax.decimalValue).toString();
            // Custom Start : Added subtotal
            produtObj.subtotal = orderSubTotal;
            // Custom End
            // Custom Start : Added discount tax shipping with pipe bars
            produtObj.discountTaxShipping = getOrderLevelDiscount(productLineItem) + orderLevelPromotionPrice  + Constants.MOVADO_SHIPPING_PIPE_BARS +  productLineItem.tax.decimalValue + Constants.MOVADO_SHIPPING_PIPE_BARS + productLineItem.shipment.shippingTotalGrossPrice.decimalValue;
            // Custom End
            // Custom Start : Added  city state zip
            produtObj.cityStateZipCode = (order.billingAddress) ? order.billingAddress.city + Constants.MOVADO_SHIPPING_PIPE_BARS + order.billingAddress.stateCode + Constants.MOVADO_SHIPPING_PIPE_BARS + order.billingAddress.postalCode: '';
            // Custom End
            // Custom Start : Added  currency
            produtObj.currency = (productLineItem.product.priceModel.price.available ? (productLineItem.product.priceModel.price.currencyCode) : (productLineItem.product.priceModel.minPrice.currencyCode));
            // Custom End
            // Custom Start : Added  product quantity
            produtObj.quantity = productLineItem.product.priceModel.basePriceQuantity.value;
            // Custom End
            // Custom Start : Added  total product quantity
            produtObj.productQuantityTotal =  order.productQuantityTotal;

            produtObj.orderLevelPromotionPrice = orderLevelPromotionPrice;
            // Custom End

            // Custom Start : Added VAT for OBUK
            if (Site.current.ID === 'OliviaBurtonUK') {
                produtObj.productVatAmount = ((!empty(productLineItem.basePrice.decimalValue)) && (!empty(productLineItem.adjustedPrice.decimalValue)) && (productLineItem.bonusProductLineItem === false)) 
                    ? (productLineItem.basePrice.decimalValue !== productLineItem.adjustedPrice.decimalValue) 
                    ? (productLineItem.adjustedPrice.decimalValue * 20 / 100) : (productLineItem.basePrice.decimalValue * 20 / 100) 
                    : '';
                produtObj.productMerchValue = ((!empty(productLineItem.basePrice.decimalValue)) && (!empty(productLineItem.adjustedPrice.decimalValue)) && (productLineItem.bonusProductLineItem === false))
                    ? (productLineItem.basePrice.decimalValue !== productLineItem.adjustedPrice.decimalValue)
                    ? (productLineItem.adjustedPrice.decimalValue - produtObj.productVatAmount) : (productLineItem.basePrice.decimalValue - produtObj.productVatAmount)
                    : '';
            }
            // Custom End

                produtObj.itemCoupon = itemLevelCouponString;

                if (orderJSONArray.length < 10) {
                    orderJSONArray.push({ productObj: produtObj });
                } else {
                    gtmorderConfObj.push(orderJSONArray);
                    orderJSONArray = [];
                    orderJSONArray.push({ productObj: produtObj });
                }
        });

        var orderObj = {};
        orderObj.orderId = orderId;
        orderObj.revenue = order.totalGrossPrice.decimalValue;
        orderObj.tax = order.totalTax.decimalValue;
        orderObj.shipping = order.shippingTotalPrice.decimalValue;

        // Custom Start : Added VAT for OBUK
        if (Site.current.ID === 'OliviaBurtonUK') {
            orderObj.shippingVatAmount = order.shippingTotalPrice.decimalValue * 20 / 100;
            orderObj.shippingMerchValue = order.shippingTotalPrice.decimalValue - orderObj.shippingVatAmount;
        }
        // Custom End

        orderObj.orderCoupon = orderLevelCouponString;
        orderObj.country = order.billingAddress.countryCode.displayValue;
        orderObj.paymentMethod = paymentMethod;

        // Custom Start : Added VAT for OBUK
        if (Site.current.ID === 'OliviaBurtonUK') {
            orderObj.orderVatAmount = order.totalGrossPrice.decimalValue * 20 / 100;
            orderObj.orderMerchValue = order.totalGrossPrice.decimalValue - orderObj.orderVatAmount;
        }
        // Custom End

        orderJSONArray.push({ orderObj: orderObj });
        gtmorderConfObj.push(orderJSONArray);
    }
}

/**
 *
 * @param pid
 * @returns formatted pid
 */
function formatProductId(pid) {
    if (pid != null && pid.indexOf('%') > -1) {
        return pid.replace(/%20/g, ' ');
    }

    return pid;
}

/**
 * function to get total order level discount
 * @param {dw.order.Order} order
 * returns {Number} orderPriceAdjustment
 */

function getOrderLevelDiscount (order) {
    try {
        var orderPriceAdjustment;
        var totalOrderPriceAdjustment = 0.0;
        for (var i = 0; i < order.priceAdjustments.length; i++) {
            orderPriceAdjustment = order.priceAdjustments[i];
            totalOrderPriceAdjustment = parseFloat(totalOrderPriceAdjustment) + parseFloat(Math.abs(orderPriceAdjustment.netPrice.value));
        }
        return totalOrderPriceAdjustment;
    } catch (ex) {
        Logger.error('Error Occured while getting order adjustment for gtm. Error: {0} \n Stack: {1} \n', ex.message, ex.stack);
        return 0;
    }

}

/**
* function to get google analytics parameters array
 * @param queryStringVal
 * @param googleAnalyticsRequiredParameters
 * @returns {String} googleAnalyticsParameters
 */
function getGoogleAnalyticsParameters(queryStringVal, googleAnalyticsRequiredParameters) {
    var searchArray = [];
    var googleAnalyticsParameters = '';
    var googleAnalyticsParameter;
    var queryString = queryStringVal ? Encoding.fromURI(queryStringVal) : '';
    if (queryString.indexOf('&') >= 0) {
        searchArray = queryString.split('&');
        if (searchArray.length != 0 && !empty(googleAnalyticsRequiredParameters) &&  googleAnalyticsRequiredParameters.length != 0){
            for (var j = 0; j < googleAnalyticsRequiredParameters.length; j++) {
                for (var i = 0 ; i < searchArray.length; i++) {
                    googleAnalyticsParameter = searchArray[i].split('=');
                    if ((googleAnalyticsParameter[0].indexOf(googleAnalyticsRequiredParameters[j])) > -1) {
                        if(empty(googleAnalyticsParameters)) {
                            googleAnalyticsParameters = googleAnalyticsParameters + searchArray[i];
                        } else {
                            googleAnalyticsParameters = googleAnalyticsParameters + '&' + searchArray[i];
                        }
                    }
                }
            }
        }
    }
    return googleAnalyticsParameters;
}

module.exports = gtmModel;
