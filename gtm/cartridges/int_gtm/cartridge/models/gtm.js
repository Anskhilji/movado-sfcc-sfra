'use strict';
var Site = require('dw/system/Site');
var CatalogMgr = require('dw/catalog/CatalogMgr');
var collections = require('*/cartridge/scripts/util/collections');
var pageNameJSON = JSON.parse(Site.current.getCustomPreferenceValue('pageNameJSON'));
var productFactory = require('*/cartridge/scripts/factories/product');
var Resource = require('dw/web/Resource');
var Encoding = require('dw/crypto/Encoding');
var stringUtils = require('*/cartridge/scripts/helpers/stringUtils');

/**
 * GTM class that represents the data to be supplied to Google Tag Manager
 * @param {Object} req - request object
 * @constructor
 */
function gtmModel(req) {
    var currentCustomer = req.currentCustomer;
    var reqQueryString = req.querystring;
    var action = req.querystring.urlAction.toLowerCase();
    var searchkeyword;
    var cgid;
    var pid;
    var searchCount;
    var categoryObj;
    var productObj;
    var categoryBreadcrumbs;
    var productBreadcrumbs;
    var searchBreadcrumbs;

    this.primarySiteSection = '';
    this.secondarySiteSection = '';
    this.tertiarySiteSection = '';
    this.searchTerm = '';


    	if (req.querystring != undefined) {
    		var queryString = req.querystring.urlQueryString;
        	var searchQuery = getSearchQuery(queryString);
        	searchkeyword = searchQuery.q;
        	cgid = searchQuery.cgid;
        	pid = searchQuery.pid;
    	}
    	if (action.equals('cart-show') || reqQueryString.urlAction.indexOf('Checkout') > -1) {
    		this.checkout = [];
    		getCartJSONArray(this.checkout);
    		if (action.equals('cart-show')) {
    			this.checkoutAction = 'cart';
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

        // tenant
    var tenant = getTenant(language);

   		if (pid != null) {
    		var ProductMgr = require('dw/catalog/ProductMgr');
    		productObj = ProductMgr.getProduct(formatProductId(pid));
    		productBreadcrumbs = getProductBreadcrumb(productObj);
    		var primarySiteSection = escapeQuotes(productBreadcrumbs.primaryCategory);

    	    // get product impressions tags for PDP
    	    var productImpressionTags = getPDPProductImpressionsTags(productObj);
    	    this.product = {
    	    	productID: productImpressionTags.productID,
        	    productName: stringUtils.removeSingleQuotes(productImpressionTags.productName),
        	    brand: productImpressionTags.brand,
        	    productPersonalization: productImpressionTags.productPersonalization,
        	    category: primarySiteSection,
        	    productPrice: productImpressionTags.productPrice,
        	    list: productImpressionTags.list
    	    };
    	}    	else if (searchkeyword != null) {
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

    this.action = action != null ? action : '';
    this.tenant = (tenant != null && tenant != undefined) ? tenant : '';
    this.language = (language != null && language != undefined) ? language : '';
    this.pageType = (pageType != null && pageType != undefined) ? pageType : '';
    this.loginStatus = (loginStatus != null && loginStatus != undefined) ? loginStatus : '';
    this.searchCount = (searchCount != null && searchCount != undefined) ? searchCount : '';
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
    var searchArray = [];
    var searchQuery = '';
    var queryString = queryStringVal ? Encoding.fromURI(queryStringVal) : '';
    if (queryString.indexOf('&') >= 0) {
        searchArray = queryString.split('&');
        searchArray = searchArray[1].split('=');
        if ((searchArray[0].indexOf('q')) > -1) {
        	searchQuery = { q: searchArray[1] };
        }
    } else if ((queryString.indexOf('pid')) > -1) {
    		searchArray = queryString.split('=');
    		searchQuery = { pid: searchArray[1] };
    	}    	else if ((queryString.indexOf('cgid')) > -1) {
    		searchArray = queryString.split('=');
        searchQuery = { cgid: searchArray[1] };
    	} else if ((queryString.indexOf('q')) > -1) {
    			searchArray = queryString.split('=');
    			searchQuery = { q: searchArray[1] };
    		}
    return searchQuery;
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
 * Function to get PDP Breadcrumbs
 * @param {Object} cgid represents category ID
 * @param {Object} pid represents product ID
 * @param {Object} breadcrumbs represents product ID
 * @returns {Object} apiProductSearch returns apiProductSearch to be searched
 */
function getCategoryBreadcrumb(categoryObj) {
    var primaryCategory = '';
    var secondaryCategory = '';
    var tertiaryCategory = '';

    var levelCount = 0;
    if (categoryObj) {
        var categoryLevel = getCategoryLevelCount(categoryObj, levelCount);
        if (categoryLevel == 3) {
            tertiaryCategory = categoryObj.displayName;
            secondaryCategory = categoryObj.parent ? categoryObj.parent.displayName : '';
            primaryCategory = (categoryObj.parent ? (categoryObj.parent.parent ? categoryObj.parent.parent.displayName: '' ): '');
        } else if (categoryLevel == 2) {
            secondaryCategory = categoryObj.displayName;
            primaryCategory = categoryObj.parent ? categoryObj.parent.displayName : '';
        } else if (categoryLevel == 1) {
            primaryCategory = categoryObj.displayName;
        }
    }
    return { primaryCategory: primaryCategory, secondaryCategory: secondaryCategory, tertiaryCategory: tertiaryCategory };
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
    var categoryHierarchy = getCategoryBreadcrumb(category);
    return { primaryCategory: categoryHierarchy.primaryCategory };
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
    var currentCategory = category.parent;
    if (!category.root) {
        levelCount += 1;
        levelCount = getCategoryLevelCount(currentCategory, levelCount);
    }
    return levelCount;
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

    var prodOptionArray = getProductOptions(productObj.optionModel.options);

    productPersonalization = prodOptionArray != null ? prodOptionArray : '';
    return { productID: productID, productName: productName, brand: brand, productPersonalization: productPersonalization, productPrice: productPrice, list: 'PDP' };
}


/**
 *
 * @param categoryObj
 * @returns
 */
function getBasketParameters() {
    var BasketMgr = require('dw/order/BasketMgr');
    var currentBasket = BasketMgr.getCurrentBasket();
    var cartJSON = [];
    if (currentBasket) {
        var cartItems = currentBasket.allProductLineItems;
        var appliedCoupons = getCouponsOnOrder(currentBasket.couponLineItems);
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
                    coupon: appliedCoupons });
            }
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
        cartObj.coupon = cartJSON[i].coupon;

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
    if (order != null && order.productLineItems != null) {
        var orderLevelCouponString = '';
        var itemLevelCouponString = '';
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
            var variants = getVariants(productLineItem);
            var produtObj = {};

            produtObj.id = productLineItem.product.ID;
            produtObj.name = stringUtils.removeSingleQuotes(productLineItem.product.name);
            produtObj.brand = productLineItem.product.brand;
            produtObj.category = escapeQuotes(productLineItem.product.variant ? ((productLineItem.product.masterProduct != null && productLineItem.product.masterProduct.primaryCategory != null) ? productLineItem.product.masterProduct.primaryCategory.ID
                : '')
                : ((productLineItem.product.primaryCategory != null) ? productLineItem.product.primaryCategory.ID : ''));
            produtObj.variant = variants;
            produtObj.price = productLineItem.getAdjustedNetPrice().getDecimalValue().toString();
            produtObj.currency = (productLineItem.product.priceModel.price.available ? (productLineItem.product.priceModel.price.currencyCode) : (productLineItem.product.priceModel.minPrice.currencyCode));

			    produtObj.quantity = productLineItem.product.priceModel.basePriceQuantity.value;

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
        orderObj.orderCoupon = orderLevelCouponString;
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

module.exports = gtmModel;
