'use strict';

var Bytes = require('dw/util/Bytes');
var CatalogMgr = require('dw/catalog/CatalogMgr');
var Encoding = require('dw/crypto/Encoding');
var Resource = require('dw/web/Resource');
var Site = require('dw/system/Site');
var URLUtils = require('dw/web/URLUtils');
var Logger = require('dw/system/Logger');
var HashMap = require('dw/util/HashMap');
var formatMoney = require('dw/util/StringUtils').formatMoney;

var collections = require('*/cartridge/scripts/util/collections');
var productFactory = require('*/cartridge/scripts/factories/product');
var pageNameJSON = JSON.parse(Site.current.getCustomPreferenceValue('pageNameJSON'));
var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
var stringUtils = require('*/cartridge/scripts/helpers/stringUtils');
var googleAnalyticsHelpers = require('*/cartridge/scripts/helpers/googleAnalyticsHelpers');
var Constants = require('*/cartridge/scripts/helpers/utils/Constants');

var isEswEnabled = !empty(Site.current.getCustomPreferenceValue('eswEshopworldModuleEnabled')) ?
        Site.current.getCustomPreferenceValue('eswEshopworldModuleEnabled') : false;

/**
 * GTM class that represents the data to be supplied to Google Tag Manager
 * @param {Object} req - request object
 * @constructor
 */
function gtmModel(req) {
    var country;
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
    var categoryObj;
    var productObj;
    var categoryBreadcrumbs;
    var productBreadcrumbs;
    var searchBreadcrumbs;
    var userShippingDetails;
    var departmentCategoryName;

    this.primarySiteSection = '';
    this.secondarySiteSection = '';
    this.tertiarySiteSection = '';
    this.searchTerm = '';
    this.googleAnalyticsParameters = '';


        if (!empty(req.querystring)) {
            var queryString = req.querystring.urlQueryString;
            var searchQuery = getSearchQuery(queryString);
            // Custom Start : get google analytics arrat from site prefrence
            var googleAnalyticsParameters = getGoogleAnalyticsParameters(queryString, googleAnalyticsHelpers.getGoogleAnalyticsParameters());
            // Custom End
            searchkeyword = searchQuery.q ? searchQuery.q : '';
            cgid = searchQuery.cgid;
            pid = searchQuery.pid;
        }            
        if (cgid != null || searchkeyword != null) {
            departmentCategoryName = getPLPDepartmentCategory(req, cgid, searchkeyword);
        }
        if (action.equals('cart-show') || reqQueryString.urlAction.indexOf('Checkout') > -1) {
            this.checkout = [];
            getCartJSONArray(this.checkout);
            if (action.equals('checkout-login')) {
                this.checkoutAction = 'checkout';
                checkoutStage = 1;
            } else {
                checkoutActionObject = getCheckoutQueryString(reqQueryString.urlQueryString).stage;
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

        // country
    try {
        if (isEswEnabled && request.httpCookies['esw.location'] != null && request.httpCookies['esw.location'].value != null) {
            var eswCustomHelper = require('*/cartridge/scripts/helpers/eswCustomHelper');
            country = eswCustomHelper.getCustomCountryByCountryCode(request.httpCookies['esw.location'].value).displayName;
        } else {
            country = currentLocale.displayCountry;
        }
    } catch(ex) {
        Logger.error('Error Occured while getting country displayName for gtm. Error: {0} \n Stack: {1} \n', ex.message, ex.stack);
    }

        // tenant
    var tenant = getTenant(language);

        //custom start: Email

    var userEmail = !empty(getCustomerProfile(currentCustomer)) ? getCustomerProfile(currentCustomer).email : '';

        //custom start: Hashed email
    var userHashedEmail = Encoding.toHex(new Bytes(userEmail, 'UTF-8'));

        //custom start: user firstName
    var userFirstName = !empty(getCustomerProfile(currentCustomer)) ? stringUtils.removeSingleQuotes(getCustomerProfile(currentCustomer).firstName) : '';

        //custom start: user last name
    var userLastName = !empty(getCustomerProfile(currentCustomer)) ? stringUtils.removeSingleQuotes(getCustomerProfile(currentCustomer).lastName) : '';

        //custom start: currencyCode
    var currencyCode = isEswEnabled && request.httpCookies['esw.currency'] != null ? request.httpCookies['esw.currency'].value : Site.getCurrent().getCurrencyCode();
    
    //custom start: userPhone
    var userPhone = !empty(getCustomerProfile(currentCustomer)) ? getCustomerProfile(currentCustomer).phone : '';
    
    var customerType = getCustomerType(currentCustomer);
    
    var userZip = getUserZip(currentCustomer);
        // Custom End

        if (pid != null) {
            var ProductMgr = require('dw/catalog/ProductMgr');
            productObj = ProductMgr.getProduct(formatProductId(pid));
            productBreadcrumbs = getProductBreadcrumb(productObj);
            var primarySiteSection = productBreadcrumbs ? escapeQuotes(productBreadcrumbs.primaryCategory) : '';
            var secondarySiteSection = productBreadcrumbs ? escapeQuotes(productBreadcrumbs.secondaryCategory) : '';
            secondarySiteSection = (!empty(secondarySiteSection)) ? '|' + secondarySiteSection : '';
            var departmentCategoryName = primarySiteSection + secondarySiteSection;
            departmentCategoryName = (!empty(departmentCategoryName)) ? departmentCategoryName : primarySiteSection;

            // get product impressions tags for PDP
            var productImpressionTags = getPDPProductImpressionsTags(productObj, req.querystring.urlQueryString);
            // Custom Start Updated product values according to mvmt
            if (!empty(productImpressionTags)) {
                this.product = {
                    productID: productImpressionTags && productImpressionTags.productID ? productImpressionTags.productID : '',
                    productName: productImpressionTags && productImpressionTags.productName ? stringUtils.removeSingleQuotes(productImpressionTags.productName) : '',
                    brand: productImpressionTags && productImpressionTags.brand ? productImpressionTags.brand : '',
                    productPersonalization: productImpressionTags && productImpressionTags.productPersonalization ? productImpressionTags.productPersonalization : '',
                    category: stringUtils.removeSingleQuotes(productImpressionTags && productImpressionTags.customCategory) ? productImpressionTags.customCategory : '',
                    currentCategory: stringUtils.removeSingleQuotes(primarySiteSection),
                    productPrice: productImpressionTags && productImpressionTags.productPrice ? productImpressionTags.productPrice : '',
                    list: productImpressionTags && productImpressionTags.list ? productImpressionTags.list : '',
                    Sku: productImpressionTags && productImpressionTags.Sku ? productImpressionTags.Sku : '',
                    variantID: productImpressionTags && productImpressionTags.variantID ? productImpressionTags.variantID : '',
                    productType: productImpressionTags && productImpressionTags.productType ? productImpressionTags.productType : '',
                    variant: productImpressionTags && productImpressionTags.variant ? productImpressionTags.variant : '',
                    currency: productImpressionTags && productImpressionTags.currency ? productImpressionTags.currency : '',
                    // Custom start: Added secoundary category if exist and quantity on product on pdp
                    deparmentIncludedCategoryName: departmentCategoryName,
                    quantity: '1'
                    // Custom End
                };
            } else {
                this.product = {};
            }
        } else if (searchkeyword != null) {
            // search count
        searchCount = (getProductSearch(req, searchQuery).count) != 0 ? (getProductSearch(req, searchQuery).count) : '';
        this.searchTerm = (searchkeyword != null && searchkeyword != undefined) ? stringUtils.removeSingleQuotes(searchkeyword) : '';

        var searchQuery = { q: searchkeyword };
        var productArray = getSearchResultProducts(req, searchQuery);
        if (productArray == 0) {
            searchCount = 0;
        }

        if (searchCount == 0 && pageNameJSON != null && empty(pageType)) {
           pageType = pageNameJSON['no-searchresult-page'];
        }
    }

    if (action.equals('order-confirm')) {
        var orderId = getOrderIDfromQueryString(queryString);
        this.orderConfirmation = [];
        getOrderConfirmationArray(this.orderConfirmation, orderId);
        userShippingDetails = getUserShippingDetails(orderId);
    }
    // Custom Start Updated PageData values according to mvmt
    this.pageUrl = !empty(pageUrl) ? pageUrl : '';
    this.action = action != null ? action : '';
    this.tenant = !empty(tenant) ? tenant : '';
    this.referralUrl = !empty(referralUrl) ? referralUrl : '';
    this.language = (language != null && language != undefined) ? language : '';
    this.pageType = (pageType != null && pageType != undefined) ? pageType : '';
    this.loginStatus = (loginStatus != null && loginStatus != undefined) ? loginStatus : '';
    this.searchCount = (searchCount != null && searchCount != undefined) ? searchCount : '';
    this.userEmail = userShippingDetails && !empty(userShippingDetails.userShippingEmail) ? userShippingDetails.userShippingEmail : (!empty(userEmail) ? userEmail : '');
    this.userFirstName = userShippingDetails  && !empty(userShippingDetails.userShippingFirstName) ? stringUtils.removeSingleQuotes(userShippingDetails.userShippingFirstName) : (!empty(userFirstName) ? stringUtils.removeSingleQuotes(userFirstName) : '');
    this.userLastName = userShippingDetails && !empty(userShippingDetails.userShippingLastName) ? stringUtils.removeSingleQuotes(userShippingDetails.userShippingLastName) : (!empty(userLastName) ? stringUtils.removeSingleQuotes(userLastName) : '');
    this.userPhone = userShippingDetails && !empty(userShippingDetails.userShippingPhone) ? userShippingDetails.userShippingPhone : (!empty(userPhone) ? userPhone : '');
    this.country =  !empty(country) ? country : '';
    this.currencyCode = (currencyCode != null && currencyCode != undefined) ? currencyCode : '';
    this.customerType = (customerType != null && customerType != undefined) ? customerType : '';
    this.userZip = userShippingDetails && !empty (userShippingDetails.userShippingPostalCode) ? userShippingDetails.userShippingPostalCode : (!empty(userZip) ? userZip : '');
    this.userHashedEmail = userShippingDetails && !empty (userShippingDetails.userShippingEmail) ? Encoding.toHex(new Bytes(userShippingDetails.userShippingEmail, 'UTF-8')) : (!empty(userHashedEmail) ? userHashedEmail : '');
    this.googleAnalyticsParameters = googleAnalyticsParameters != null ? googleAnalyticsParameters : '';
    this.departmentCategoryName = (departmentCategoryName != null && departmentCategoryName != undefined && !empty(departmentCategoryName)) ? departmentCategoryName : '';
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

/** Custom Changes Start:
 * Return  user zip
 * @param currentCustomer
 */

function getUserZip(currentCustomer) {
    var userZip = '';
    if (currentCustomer.raw.authenticated && currentCustomer.addressBook.addresses) {
        userZip = !empty(currentCustomer.addressBook.addresses[0]) ? currentCustomer.addressBook.addresses[0].postalCode : '';
    }
     return userZip;
}

/** Custom Changes Start:
 * Return  Customer Type
 * @param currentCustomer
 */

function getCustomerType(currentCustomer) {
    var customerType = 'Returning User';
    if (currentCustomer.raw.anonymous) {
        customerType = 'New User';
    }
     return customerType;
}

/**
 * Return if user is logged-in or guest
 * @param currentCustomer
 * @returns loginStatus
 */
function getCustomerProfile(currentCustomer) {
    var profile = '';
    if (currentCustomer.raw.authenticated) {
        var profile = {
                email: currentCustomer.profile.email,
                firstName: currentCustomer.profile.firstName,
                lastName: currentCustomer.profile.lastName,
                phone: currentCustomer.profile.phone,
        }
    }
     return profile;
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
            }
    
            if ((queryString.indexOf('dwvar_')) > -1 && (queryString.indexOf('pid')) > -1) {
                searchArray = queryString.split('=');
                searchQuery = { pid: searchArray[searchArray.length - 1] };
            }
    
        } else if ((queryString.indexOf('pid')) > -1) {
                searchArray = queryString.split('=');
                searchQuery = { pid: searchArray[1] };
            }       else if ((queryString.indexOf('cgid')) > -1) {
                searchArray = queryString.split('=');
            searchQuery = { cgid: searchArray[1] };
            } else if ((queryString.indexOf('q')) > -1) {
                    searchArray = queryString.split('=');
                    searchQuery = { q: searchArray[1] };
                }
        return searchQuery;
    } catch(ex) {
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
    try {
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
    } catch (ex) {
        Logger.error('Error occured while getting product search count for gtm. Error: {0} \n Stack: {1} \n', ex.message, ex.stack);
        return '';
    }
}


/**
 * Function to get PDP Breadcrumbs
 * @param {Object} cgid represents category ID
 * @param {Object} pid represents product ID
 * @param {Object} breadcrumbs represents product ID
 * @returns {Object} apiProductSearch returns apiProductSearch to be searched
 */
function getCategoryBreadcrumb(categoryObj) {
    try {
        var primaryCategory = '';
        var secondaryCategory = '';
        var tertiaryCategory = '';
    
        var levelCount = 0;
        if (categoryObj) {
            var categoryLevel = getCategoryLevelCount(categoryObj, levelCount);
            if (categoryLevel == 3) {
                tertiaryCategory = stringUtils.removeSingleQuotes(categoryObj.displayName);
                secondaryCategory = categoryObj.parent ? stringUtils.removeSingleQuotes(categoryObj.parent.displayName) : '';
                primaryCategory = (categoryObj.parent ? (categoryObj.parent.parent ? stringUtils.removeSingleQuotes(categoryObj.parent.parent.displayName): '' ): '');
            } else if (categoryLevel == 2) {
                secondaryCategory = stringUtils.removeSingleQuotes(categoryObj.displayName);
                primaryCategory = categoryObj.parent ? stringUtils.removeSingleQuotes(categoryObj.parent.displayName) : '';
            } else if (categoryLevel == 1) {
                primaryCategory = stringUtils.removeSingleQuotes(categoryObj.displayName);
            }
        }
        return { primaryCategory: primaryCategory, secondaryCategory: secondaryCategory, tertiaryCategory: tertiaryCategory };
    } catch (ex) {
        Logger.error('Error occured while getting category breadcrumb for gtm. Error: {0} \n Stack: {1} \n', ex.message, ex.stack);
        return '';
    }

}

/**
 *
 * @param productObj
 * @returns productBreadcrumb
 */
function getProductBreadcrumb(productObj) {
    try {
        var category = productObj && productObj.variant && !!productObj.masterProduct.primaryCategory
        ? productObj.masterProduct.primaryCategory
        : productObj.primaryCategory;
        var categoryHierarchy = getCategoryBreadcrumb(category);
        return { primaryCategory: categoryHierarchy.primaryCategory, secondaryCategory: categoryHierarchy.secondaryCategory, tertiaryCategory: categoryHierarchy.tertiaryCategory   };
    } catch (ex) {
        Logger.error('Error occured while getting product bread crumb. Error: {0} \n Stack: {1} \n', ex.message, ex.stack);
        return '';
    }
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
 * @param category
 * @returns levelCount
 */
function getCategoryLevelCount(category, levelCount) {
    try {
        var currentCategory = category.parent;
        if (!category.root) {
            levelCount += 1;
            levelCount = getCategoryLevelCount(currentCategory, levelCount);
        }
        return levelCount;
    } catch (ex) {
        Logger.error('Error occured while getting category level count for gtm. Error: {0} \n Stack: {1} \n', ex.message, ex.stack);
        return '';
    }

}

/**
 *
 * @param productObj
 * @returns
 */
// Custom Changes Updated data layer according to mvmt
function getPDPProductImpressionsTags(productObj, queryString) {
    try {
        var variantSize = '';
        var productID = productObj.ID;
        var selectedVariant;
        var jewelryType = '';
        var watchGender = '';
        var currency = (productObj.priceModel.price && productObj.priceModel.price.available ? (productObj.priceModel.price.currencyCode) : (productObj.priceModel.minPrice.currencyCode));
        if (productObj.master) {
            var variantFilter = getVariantFilter(queryString);
            if (variantFilter.length > 0) {
                selectedVariant = productObj.getVariationModel() ? productObj.getVariationModel().getVariants(variantFilter)[0] : ''; 
            }
            if (!empty(selectedVariant)) { 
                productID = selectedVariant.getID();
                productObj = selectedVariant;
                collections.forEach(selectedVariant.variationModel.productVariationAttributes, function(variationAttribute) {
                    if (variationAttribute.displayName.equalsIgnoreCase('Size')) {
                        variantSize = productObj.variationModel.getVariationValue(selectedVariant, variationAttribute);
                    }
                });
            }
        }

        if (productObj.variant) {
            collections.forEach(productObj.variationModel.productVariationAttributes, function(variationAttribute) {
                if (variationAttribute.displayName.equalsIgnoreCase('Size')) {
                    variantSize = productObj.variationModel.getSelectedValue(variationAttribute);
                }
            });
        }
        if (productObj.custom.watchGender && productObj.custom.watchGender.length) {
            watchGender = productObj.custom.watchGender[0];
        }
        if (!empty(productObj.custom.jewelryType)) {
            jewelryType = productObj.custom.jewelryType;
        }
        var customCategory = stringUtils.removeSingleQuotes(watchGender + " " + jewelryType);
        var productName = stringUtils.removeSingleQuotes(productObj.name);
        var brand = stringUtils.removeSingleQuotes(productObj.brand);
        var productPersonalization = '';
        var productModel = productFactory.get({pid: productID});
        var productPrice = productModel.price && productModel.price.sales ? productModel.price.sales.decimalPrice : (productModel.price && productModel.price.list ? productModel.price.list.decimalPrice : '');
        var sku = productObj.ID;
        var variantID = '';
        var productType = productModel.productType;
        var prodOptionArray = getProductOptions(productObj.optionModel.options);
        var variant = !empty(variantSize) ? variantSize.displayValue : '';

        productPersonalization = prodOptionArray != null ? prodOptionArray : '';
        return { productID: productID, variantID:variantID, productType:productType, customCategory:customCategory, Sku:sku, productName: productName, brand: brand, productPersonalization: productPersonalization, variant: variant, productPrice: productPrice, list: 'PDP', currency: currency };
    } catch (ex) {
        Logger.error('Error Occured while getting product impressions tags for gtm against lineitem. Error: {0} \n Stack: {1} \n', ex.message, ex.stack);
        return '';
    }
}

/**
 * @param {queryString} queryString
 */
function getVariantFilter(queryStringVal) {
    var queryString = queryStringVal ? Encoding.fromURI(queryStringVal) : '';
    var searchArray = queryString.split('&');
    var variantFilter = new HashMap();
    for (var index = 0; index < searchArray.length; index++) {
        var searchItem = searchArray[index].split('=');
        if (searchItem[0] !== 'pid') { 
            var splitedQueryParam = searchItem[0].split('_');
            var attributeName = splitedQueryParam[splitedQueryParam.length - 1];
            var attibuteValue = searchItem[1];
            variantFilter.put(attributeName, attibuteValue);
        }
    }
    return variantFilter;
}


/**
 *
 * @param categoryObj
 * @returns
 */
// Custom changes Updated dataLayer according to mvmt
function getBasketParameters() {
    var BasketMgr = require('dw/order/BasketMgr');
    var ProductMgr = require('dw/catalog/ProductMgr');
    var TotalsModel = require('*/cartridge/models/totals');
    var currentBasket = BasketMgr.getCurrentBasket();
    //Custom start: get total product quantity 
    var productQuantityTotal = !empty(currentBasket) && !empty(currentBasket.productQuantityTotal) ? currentBasket.productQuantityTotal : 0;
    // Custom End
    var currencyCode = !empty(currentBasket) && !empty(currentBasket.currencyCode) ? currentBasket.currencyCode : '';
    var totalsModel = new TotalsModel(currentBasket);
    var cartJSON = [];
    if (currentBasket) {
        var cartItems = currentBasket.allProductLineItems;
        var appliedCoupons = getCouponsOnOrder(currentBasket.couponLineItems);
        var countryDisplayName = (currentBasket.billingAddress) ? currentBasket.billingAddress.countryCode.displayValue : '';
        var paymentMethod = !empty(currentBasket.paymentInstrument) ? currentBasket.paymentInstrument.paymentMethod : '';
        // Custom Start : Added city state zip code with pipe bars
        var cityStateZipCode = (currentBasket.billingAddress) ? currentBasket.billingAddress.city + Constants.MOVADO_SHIPPING_PIPE_BARS + currentBasket.billingAddress.stateCode + Constants.MOVADO_SHIPPING_PIPE_BARS + currentBasket.billingAddress.postalCode: '';
        // Custom End
        var jewelryType = '';
        var watchGender = '';
        collections.forEach(cartItems, function (cartItem) {
            if (cartItem.product != null && cartItem.product.optionModel != null) {
                var variants = getVariants(cartItem);
                var productObj = ProductMgr.getProduct(cartItem.productID);
                if (productObj.custom.watchGender && productObj.custom.watchGender.length) {
                    watchGender = productObj.custom.watchGender[0];
                }
                if (!empty(productObj.custom.jewelryType)) {
                    jewelryType = productObj.custom.jewelryType;
                }
                var customCategory = watchGender + " " + jewelryType;
                var productModel = productFactory.get({pid: cartItem.productID});
                var productPrice = productModel.price && productModel.price.sales ? productModel.price.sales.decimalPrice : (productModel.price && productModel.price.list ? productModel.price.list.decimalPrice : '');
                cartJSON.push({
                    id: cartItem.productID,
                    name: stringUtils.removeSingleQuotes(cartItem.productName),
                    brand: stringUtils.removeSingleQuotes(cartItem.product.brand),
                    category: customCategory,
                    variant: variants,
                    imageURL: cartItem.product.image.absURL,
                    prouctUrl: URLUtils.url('Product-Show', 'pid', cartItem.productID).abs().toString(),
                    productType: productModel.productType,
                    price: productPrice,
                    description: stringUtils.removeSingleQuotes(cartItem.product.shortDescription.markup),
                    quantity:cartItem.quantityValue,
                    revenue: cartItem.grossPrice.decimalValue,
                    totalProductQuantity: productQuantityTotal,
                    tax: cartItem.tax.decimalValue,
                    shipping: cartItem.shipment.shippingTotalGrossPrice.decimalValue,
                    coupon: appliedCoupons,
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
            }
        });
    }
    return cartJSON;
}

/**
 *
 * @returns array of cart json
 */
// Custom changes Updated dataLayer according to mvmt

function getCartJSONArray(checkoutObject) {
    var cartJSON = getBasketParameters();
    var cartArray = [];

    try {
        for (var i = 0; i < cartJSON.length; i++) {
            var cartObj = {};
            cartObj.id = cartJSON[i].id;
            cartObj.name = stringUtils.removeSingleQuotes(cartJSON[i].name);
            cartObj.price = cartJSON[i].price;
            cartObj.brand = stringUtils.removeSingleQuotes(cartJSON[i].brand);
            cartObj.category = stringUtils.removeSingleQuotes(escapeQuotes(cartJSON[i].category));
            cartObj.variant = cartJSON[i].variant;
            cartObj.position = cartJSON[i].position;
            cartObj.revenue = cartJSON[i].revenue;
            cartObj.tax = cartJSON[i].tax;
            cartObj.coupon = (!empty(cartJSON[i].coupon)) ? cartJSON[i].coupon : 0;
            cartObj.shipping = cartJSON[i].shipping;
            cartObj.productType = cartJSON[i].productType;
            cartObj.description = stringUtils.removeSingleQuotes(escape(cartJSON[i].description.markup));
            cartObj.quantity = cartJSON[i].quantity;
            cartObj.imageURL = cartJSON[i].imageURL;
            cartObj.prouctUrl = cartJSON[i].prouctUrl;
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
    } catch (ex) {
        Logger.error('Error occured while getting cart json array for gtm. Error: {0} \n Stack: {1} \n', ex.message, ex.stack);
        return '';
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
    var ProductMgr = require('dw/catalog/ProductMgr');
    var order = OrderMgr.getOrder(orderId);
    var averageOrderLevelDiscount = getAverageOrderLevelDiscount(order);
    var paymentMethod = '';
    if (order != null && order.productLineItems != null) {
        var orderLevelCouponString = 0;
        var itemLevelCouponString = '';
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
                } else if (priceAdjustment.promotion.promotionClass == 'PRODUCT') {
                    itemLevelCouponString = getCouponsOnOrder(order.couponLineItems);
                }
            });
        });

        var orderJSONArray = [];
        collections.forEach(order.productLineItems, function (productLineItem) {
            try {
                var variants = getVariants(productLineItem);
                var produtObj = {};
                var watchGender = "";
                var jewelryType = "";

                var productObj = ProductMgr.getProduct(productLineItem.product.ID);
                if (productObj.custom.watchGender && productObj.custom.watchGender.length) {
                    watchGender = productObj.custom.watchGender[0];
                }
                if (!empty(productObj.custom.jewelryType)) {
                    jewelryType = productObj.custom.jewelryType;
                }
                var customCategory = watchGender + " " + jewelryType;

                produtObj.id = productLineItem.product.ID;
                produtObj.name = stringUtils.removeSingleQuotes(productLineItem.product.name);
                produtObj.brand = stringUtils.removeSingleQuotes(productLineItem.product.brand);
                produtObj.category = stringUtils.removeSingleQuotes(customCategory),
                produtObj.variant = variants;
                produtObj.price = (productLineItem.getAdjustedNetPrice().getDecimalValue() - averageOrderLevelDiscount) / productLineItem.quantityValue;
                produtObj.currency = (productLineItem.product.priceModel.price.available ? (productLineItem.product.priceModel.price.currencyCode) : (productLineItem.product.priceModel.minPrice.currencyCode));
                produtObj.description = '';
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
                if (!empty(productLineItem.product.shortDescription)) {
                    produtObj.description = stringUtils.removeSingleQuotes(productLineItem.product.shortDescription.markup);
                }
                produtObj.productType = productHelper.getProductType(productLineItem.product);
                produtObj.imageURL = productLineItem.product.image.absURL;
                produtObj.productURL = URLUtils.url('Product-Show', 'pid', productLineItem.productID).abs().toString();
                produtObj.quantity = productLineItem.quantityValue;

                produtObj.itemCoupon = itemLevelCouponString;

                if (orderJSONArray.length < 10) {
                    orderJSONArray.push({ productObj: produtObj });
                } else {
                    gtmorderConfObj.push(orderJSONArray);
                    orderJSONArray = [];
                    orderJSONArray.push({ productObj: produtObj });
                }
            } catch (ex) {
                Logger.error('Error Occured while getting order details for gtm against lineitem. Error: {0} \n Stack: {1} \n', ex.message, ex.stack);
            }
        });

        // Custom changes Updated dataLayer according to mvmt
        var orderObj = {};
        var orderPriceAdj;
        var totalOrderPriceAdjValue = 0.0;
        orderObj.orderId = orderId;
        orderObj.tenderType = order.paymentInstrument.custom.adyenPaymentMethod ? order.paymentInstrument.custom.adyenPaymentMethod : order.paymentInstrument.paymentMethod;
        orderObj.orderQuantity = order.productLineItems.length;
        orderObj.revenue = order.getAdjustedMerchandizeTotalGrossPrice().decimalValue + order.shippingTotalPrice.decimalValue;
        orderObj.tax = order.totalTax.decimalValue;
        orderObj.shipping = order.shippingTotalPrice.decimalValue;
        orderObj.orderCoupon = orderLevelCouponString;
        orderObj.salesRevenue = order.getAdjustedMerchandizeTotalNetPrice().decimalValue; 
        orderObj.city = order.shipments[0].shippingAddress.city;
        orderObj.state = order.shipments[0].shippingAddress.stateCode;
        orderObj.shippingOption = order.shipments[0].shippingMethodID;
        orderObj.discount = getOrderLevelDiscount(order);
        orderObj.discountType = getDicountType(order);
        orderObj.currencyCode = order.currencyCode;
        orderObj.country = !empty(order.billingAddress) && !empty(order.billingAddress.countryCode) ? order.billingAddress.countryCode.displayValue : '';
        orderObj.paymentMethod = paymentMethod;
        orderJSONArray.push({ orderObj: orderObj });
        gtmorderConfObj.push(orderJSONArray);
    }
}

function getUserShippingDetails(orderId) {
    var order = require('dw/order/Order');
    var OrderMgr = require('dw/order/OrderMgr');
    var order = OrderMgr.getOrder(orderId);
    var shippingDetails = {};
    try {
        shippingDetails.userShippingFirstName = stringUtils.removeSingleQuotes(order.shipments[0].shippingAddress.firstName);
        shippingDetails.userShippingLastName = stringUtils.removeSingleQuotes(order.shipments[0].shippingAddress.lastName);
        shippingDetails.userShippingPhone = order.shipments[0].shippingAddress.phone;
        shippingDetails.userShippingPostalCode = order.shipments[0].shippingAddress.postalCode;
        shippingDetails.userShippingStateCode = order.shipments[0].shippingAddress.stateCode;
        shippingDetails.userShippingCity = order.shipments[0].shippingAddress.city;
        shippingDetails.userShippingEmail = order.customerEmail;
    } catch (e) {
        Logger.error('Error Occured while getting user shipping details for gtm', e, e.stack);
    }

    return shippingDetails;
}

/**
 * function to get average order level discount
 * @param {dw.order.Order} order 
 * returns {Number} average order level discount
 */
function getAverageOrderLevelDiscount(order) {
    try {
        var averageProductLevelDiscount = 0.0;
        var totalOrderPriceAdjustment = getOrderLevelDiscount (order);
        averageProductLevelDiscount = totalOrderPriceAdjustment / order.productLineItems.length;
        return averageProductLevelDiscount;
    } catch (ex) {
        Logger.error('Error occured while getting average order level discount for gtm. Error: {0} \n Stack: {1} \n', ex.message, ex.stack);
        return 0;
    }
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
 * function to get discount type
 * @param {dw.order.Order} order 
 * returns {String} discountType
 */
function getDicountType (order) {
    try {
        var discountType;
        var priceAdjustmentsItr = order.getAllLineItems().iterator();
        var priceAdjustments;
        while (priceAdjustmentsItr.hasNext()) {
            priceAdjustments = priceAdjustmentsItr.next();
            if (priceAdjustments instanceof dw.order.PriceAdjustment) {
                discountType = priceAdjustments.appliedDiscount.type;
            }
        }
        return discountType;
    } catch (ex) {
        Logger.error('Error occured while getting discount for gtm. Error: {0} \n Stack: {1} \n', ex.message, ex.stack);
        return '';
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
        if (searchArray.length != 0 && !empty(googleAnalyticsRequiredParameters)){
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

/**
 * Funtion return department and category name for plp and search query pages
 * @param req
 * @param queryString
 * @returns categoryNameWithoutApostrophe
 */
function getPLPDepartmentCategory(req, queryString, searchQuery) {
    var ProductSearchModel = require('dw/catalog/ProductSearchModel');
    var stringUtils = require('*/cartridge/scripts/helpers/stringUtils');
    var searchHelper = require('*/cartridge/scripts/helpers/searchHelpers');

    try {
    var plpCategory;
    var apiProductSearch = new ProductSearchModel();
    var queryStringItems = {
        cgid: queryString
    };
    apiProductSearch = searchHelper.setupSearch(apiProductSearch, queryStringItems);
    apiProductSearch.search();
    
    if (apiProductSearch && apiProductSearch.category && apiProductSearch.category.ID) {
        var productBreadcrumbs  = getCategoryBreadcrumb(apiProductSearch.category);
        var primaryCategory = escapeQuotes(productBreadcrumbs.primaryCategory);
        var secoundaryCategory = escapeQuotes(productBreadcrumbs.secondaryCategory);
        plpCategory = (!empty(secoundaryCategory)) ? primaryCategory + '|' + secoundaryCategory : primaryCategory;
        return plpCategory;
    } else {
        return searchQuery;
    }
    } catch (ex) {
        Logger.error('Error Occured while getting plp categories from product search. Error: {0} \n Stack: {1} \n', ex.message, ex.stack);
        return '';
    }
}

module.exports = gtmModel;
