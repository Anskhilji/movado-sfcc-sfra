var debounce = require('lodash/debounce');
var cookieHandler = require('movado/utilities/cookieHandler');

var updateDataLayer = function (string) {
    dataLayer.map(function (item, index, arr) {
        if (item.event && item.event === string) {
            delete arr[index];
        }
    });
};

var onClickLinkEvent = function () {
    $('body').on('click', '.gtm-customEvent', function (evt) {
        var $currentTarget = $(evt.currentTarget);
        if ($currentTarget.data('gtm-tracking').eventCategory === 'Search CTA') {
            $currentTarget.data('gtm-tracking').eventLabel = window.location.href;
        } else if ($currentTarget.data('gtm-tracking').eventCategory === 'Top Menu Navigation') {
            $currentTarget.data('gtm-tracking').eventAction = window.location.href;
        }
        updateDataLayer('dataTrack');
        dataLayer.push($currentTarget.data('gtm-tracking'));
        evt.stopPropagation();
    });
};

var onWishlistClickEvent = function () {
    $('body').on('addWishlist:success', function (evt, pdata) {
        var $currentTarget = $(pdata);
        $currentTarget.data('gtm-tracking').eventAction = window.location.href;
        updateDataLayer('dataTrack');
        dataLayer.push($currentTarget.data('gtm-tracking'));
    });
    $('body').on('addWishlistCart:success', function (evt, pdata) {
        pdata.eventAction = window.location.href;
        updateDataLayer('dataTrack');
        dataLayer.push(pdata);
    });
};

var getCookieSessionId = function () {
    var cookieName = '_ga';
    var googleAnalyticsSessionId = cookieHandler.getCookie(cookieName);

    if (pageDataGTM != undefined && pageDataGTM) {
        pageDataGTM.gaSessionID = googleAnalyticsSessionId;
        dataLayer.push({ pageData: pageDataGTM });
    }
};

/**
 * Custom Start: update function Added promoclick selector and data attributes change data layer structure according to mvmt
 **/

var onPromoClickEvent = function () {
    $('body').on('click', '.gtm-promotion-view, .gtm-event', function (evt) {
        var $currentTarget = $(this);
        updateDataLayer('promoClick');
        var pageType = $currentTarget.data('page-type');
        var productPromoTracking = $currentTarget.data('gtm-product-promo');
        var campaginPromoTracking = $currentTarget.data('gtm-tracking');
        if (productPromoTracking !== undefined && productPromoTracking !=='') {
            dataLayer.push({
                event: 'promoClick',
                pageType: pageType,
                ecommerce: {
                    promoClick: {
                        promotions: productPromoTracking
                    }
                }
            });
        } else {
            dataLayer.push({
                event: 'promoClick',
                ecommerce: {
                    promoClick: {
                        promotions: campaginPromoTracking
                    }
                }
            });
        }
    });
};

/**
 * Custom Start: update function updated productclick change data layer structre accoridng to mvmt
 **/

var onProductClickEvent = function () {
    $('body').on('click', '.gtm-product', function (evt) {
        var $currentTarget = $(evt.currentTarget);
        updateDataLayer('productClick');
        var dataLayerObj = [];
        dataLayerObj.push($currentTarget.data('gtm-product'));
        $.each(dataLayerObj, function (key, val) {
            if ($('.slick-slider').length) {
                val.list = 'carousel';
            }
            dataLayer.push({
                event: 'productClick',
                currencyCode: val.currency,
                ecommerce: {
                    click: {
                        products: [{ name: val.name,
                            id: val.id,
                            sku: val.id,
                            price: val.price,
                            category: val.category,
                            variant: val.variant }]
                    }
                }
            });
        });
    });
};

var onMorestyleClickEvent = function () {
    $('body').on('click', '.gtm-moreStyles-click', function (evt) {
        var $currentTarget = $(evt.currentTarget);
        updateDataLayer('productClick');
        var dataLayerObj = [];
        dataLayerObj.push($currentTarget.data('gtm-morestyles-click'));
        dataLayer.push({
            event: 'productClick',
            ecommerce: {
                click: { actionField: { list: 'More Styles' },
                    products: dataLayerObj
                }
            }
        });
    });
};

var onMorestyleLoadEvent = function () {
    $('body').on('click', '.gtm-moreStyles-click', function (evt) {
        var $currentTarget = $(evt.currentTarget);
        updateDataLayer('productImpression');
        var dataLayerObj = [];
        dataLayerObj.push($currentTarget.data('gtm-morestyles-click'));
        $.each(dataLayerObj, function (key, val) {
            dataLayer.push({
                event: 'productDetail',
                ecommerce: {
                    detail: { actionField: { list: 'More Styles' },
                        products: [{
                            id: val.id,
                            name: val.name,
                            price: val.price,
                            brand: val.brand,
                            category: val.category,
                            variant: val.variant,
                            list: 'More Styles'
                        }]
                    }
                }
            });
        });
    });
};

/**
 * Custom Start: update function updated onPDPAddProductClickEvent change data layer structre accoridng to mvmt
 **/

var onPDPAddProductClickEvent = function () {
    $('body').on('addToCart:success', function (evt, data) {
        if ($('[data-action]').data('action') == 'Product-Show') {
            updateDataLayer('addToCart');
            var addtoCartData = JSON.parse(data);
            dataLayer.push({
                event: 'addToCart',
                ecommerce: {
                    add: { 
                        products: [{
                            name: addtoCartData.name,
                            id: addtoCartData.id,
                            price: addtoCartData.price,
                            category: addtoCartData.customCategory,
                            sku: addtoCartData.id,
                            variantID: addtoCartData.variantID,
                            brand: addtoCartData.brand,
                            currentCategory: addtoCartData.category,
                            productType: addtoCartData.productType,
                            variant: addtoCartData.variant,
                            quantity: addtoCartData.quantity
                        }]
                    }
                },
                currentCart: {
                    products: addtoCartData.cartObj
                }
            });
        } else if ($('[data-action]').data('action') == 'Search-Show') {
            updateDataLayer('addToCart');
            var addtoCartData = JSON.parse(data);
            dataLayer.push({
                event: 'addToCart',
                ecommerce: {
                    add: {
                        products: [{
                            name: addtoCartData.name,
                            id: addtoCartData.id,
                            price: addtoCartData.price,
                            category: addtoCartData.customCategory,
                            sku: addtoCartData.id,
                            variantID: addtoCartData.variantID,
                            brand: addtoCartData.brand,
                            currentCategory: addtoCartData.category,
                            productType: addtoCartData.productType,
                            variant: addtoCartData.variant,
                            quantity: addtoCartData.quantity
                        }]
                    }
                },
                currentCart: {
                    products: addtoCartData.cartObj
                }
            });
        }
    });
};

/**
 * Custom Start: update function updated onAddtoCartClickEvent change data layer structre accoridng to mvmt
 **/

var onAddtoCartClickEvent = function () {
    $('body').on('click', '.gtm-addtocart', function (evt) {
        var $currentTarget = $(evt.currentTarget);
        var data = $currentTarget.data('gtm-addtocart');
        updateDataLayer('addToCart');
        dataLayer.push({
            event: 'addToCart',
            ecommerce: {
                add: {
                    products: [{
                        name: data.name,
                        id: data.id,
                        price: data.price,
                        category: data.customCategory,
                        sku: data.id,
                        variantID: data.variantID,
                        brand: data.brand,
                        currentCategory: data.category,
                        productType: data.productType,
                        variant: data.variant,
                        quantity: data.quantity
                    }]
                }
            }
        });
    });
};

var onRemoveFromCartClickEvent = function () {
    $('body').off('click', '.remove-btn').on('click', '.remove-btn', function (evt) {
        var $currentTarget = $(evt.currentTarget);
        updateDataLayer('removeFromCart');
        dataLayer.push({
            event: 'removeFromCart',
            ecommerce: {
                remove: {
                    products: [$currentTarget.data('gtm-cart')]
                }
            }
        });
    });
};

var onFacetAndPaginationClick = function () {
    $('body').on('facet:success', function (evt, data) {
        var dataLayerStr = data;
        sliceProductImpressionArray(dataLayerStr);
    });
};

/**
 * Custom Start: update function updated onLoadProductTile change data layer structre accoridng to mvmt
 **/

var onLoadProductTile = function () {
    updateDataLayer('productImpressions');
    var $currentTarget = $('.gtm-product');
    var dataLayerObj = [];
    var currency = '';
    $.each($currentTarget, function () {
        var gtmTrackingData = $(this).data('gtm-facets');
        if (gtmTrackingData !== undefined) {
            dataLayerObj.push({ name: gtmTrackingData.name,
                id: gtmTrackingData.id,
                price: gtmTrackingData.price,
                category: gtmTrackingData.category,
                sku: gtmTrackingData.sku,
                variantID: gtmTrackingData.variantID,
                brand: gtmTrackingData.brand,
                currentCategory: gtmTrackingData.currentCategory,
                productType: gtmTrackingData.productType });
            currency = gtmTrackingData.currency;
        }
    });
    sliceProductImpressionArray(dataLayerObj, currency);
};

/**
 * Custom Start: update function updated onPromoImpressionsLoad change data layer structre accoridng to mvmt
 **/

var onPromoImpressionsLoad = function (e) {
    updateDataLayer('promoImpressions');
    var dataLayerObj = [];
    var gtmTrackingData = $('.gtm-promotion-view').data('gtm-product-promo');
    var gtmTrackingPromo = $('.gtm-promotion-view').data('gtm-tracking');

    if (gtmTrackingData !== undefined && gtmTrackingData !='') {
        dataLayerObj = gtmTrackingData;

        updateDataLayer('promoImpressions');
        dataLayer.push({
            event: 'promoImpressions',
            ecommerce: {
                promoView: {
                    promotions: dataLayerObj
                }
            }
        });
    }
    
    if (gtmTrackingPromo !== undefined && gtmTrackingPromo !='') {
        dataLayerObj = gtmTrackingPromo;

        updateDataLayer('promoImpressions');
        dataLayer.push({
            event: 'promoImpressions',
            ecommerce: {
                promoView: {
                    promotions: dataLayerObj
                }
            }
        });
    }


};

/**
 * Custom Start: update function updated: sliceProductImpressionArray change data layer structre accoridng to mvmt
 **/

var sliceProductImpressionArray = function (e, currency) {
    if ($('.slick-slider').length) {
        showProductImpressionCaraousel(e, currency);
    } else {
        var maxProducts = 10;
        updateDataLayer('productImpressions');
        if (e.length > 0) {
            while (e.length) {
                var productObj = e.splice(0, maxProducts);
                dataLayer.push({
                    event: 'productImpressions',
                    ecommerce: {
                        impressions: {
                            products: productObj
                        }
                    }
                });
            }
        }
    }
};

/**
 * Custom Start: update function updated: showProductImpressionCaraousel change data layer structre accoridng to mvmt
 **/

var showProductImpressionCaraousel = function (e, currency) {
    var dataProductImpression = {};
    updateDataLayer('productImpressions');
    var productObj = e.splice(0, 7);
    dataLayer.push({
        event: 'productImpressions',
        ecommerce: {
            impressions: {
                products: productObj
            } 
        }
    });
};

/**
 * Custom Start: update function updated: getSiteSectionOnPageLoad change data layer structre accoridng to mvmt
 **/

var getSiteSectionOnPageLoad = function (e) {
    var urlPath = $('[data-url-path-gtm]').data('url-path-gtm');
    var pathName = window.location.pathname.split(urlPath)[1];
    var siteSections = pathName ? pathName.split(/[.?]/)[0].split('/') : '';
    if (pageDataGTM != undefined && pageDataGTM) {
        pageDataGTM.primarySiteSection = siteSections[0] || '';
        pageDataGTM.secondarySiteSection = escapeXml(siteSections[1]) || '';
        pageDataGTM.tertiarySiteSection = siteSections[2] || '';
        dataLayer.push({ pageData: pageDataGTM});
        dataLayer.push({ hashedEmail: pageDataGTM.hashedEmail});
    }
};

var updateCheckoutStage = function () {
    var checkoutStep;
    var checkoutStage;
    var shippingMethod;
    var paymentMethod;

    $('body').on('checkOutShipping:success', function (pEvt, pDataShipping, pShippingDisplayName, pDataCoupon) {
        $.each(checkoutDataLayer, function (key1, val1) {
            $.each(val1.ecommerce.checkout.products, function (pKey1, pVal1) {
                pVal1.shipping = pDataShipping;
                var couponCodeString = '';
                if (pDataCoupon == undefined || pDataCoupon.length == 0) {
                    pVal1.coupon = '';
                } else {
                    pDataCoupon.forEach(function (couponData) {
                        if (couponCodeString == '') {
                            couponCodeString = couponData.coupon.couponCode;
                        } else {
                            couponCodeString += ',' + couponData.coupon.couponCode;
                        }
                        pVal1.coupon = couponCodeString;
                    });
                }
            });
        });

        shippingMethod = pShippingDisplayName;
    });

    $('body').on('checkOutPayment:success', function (pEvt, paymentData) {
        paymentMethod = paymentData;
        updateDataLayer('checkoutOption');
        dataLayer.push({
            event: 'checkoutBilling',
            ecommerce: {
                checkout_shippingStage: {
                    actionField: {paymentMethod: paymentMethod }
                }
            }
        });
    });

    $('body').on('checkOutshippingStage:success', function (pEvt, checkoutShippingStage) {
        updateDataLayer('checkoutOption');
        dataLayer.push({
            event: 'checkoutShipping',
            ecommerce: {
                checkout_shippingStage: {
                    actionField: { cityStateZipCode: checkoutShippingStage.cityStateZipCode, country: checkoutShippingStage.country }
                }
            }
        });
    });

    $('body').off('checkOutStage:success').on('checkOutStage:success', function (evt, data) {
        updateDataLayer('checkout');
        checkoutStage = data;
		 switch (data) {
     case 'shipping':
             checkoutStep = ['2'];
                 pageDataGTM.pageType = 'Checkout – Shipping';
                 dataLayer.push({ pageData: pageDataGTM});
                 onCheckoutOptionOnCart('2');
         break;
     case 'payment':
             checkoutStep = ['3'];
             pageDataGTM.pageType = 'Checkout – Billing';
             onCheckoutOption(checkoutStep , shippingMethod);
             dataLayer.push({ pageData: pageDataGTM});
             onCheckoutOptionOnCart('3');
         break;
     case 'placeOrder':
             checkoutStep = ['4'];
             checkoutStage = 'Confirm';
             pageDataGTM.pageType = 'Checkout – Review';
             if (paymentMethod != undefined) {
                 onCheckoutOption(checkoutStep , paymentMethod);
             }
             dataLayer.push({ pageData: pageDataGTM});
             onCheckoutOptionOnCart('4');
         break;
     case 'submitted':
             checkoutStep = ['5'];
             checkoutStage = 'Confirmation';
             onCheckoutOptionOnCart('5');
         break;
        }
        if (checkoutDataLayer) {
            $.each(checkoutDataLayer, function (key, val) {
                var dataLayerCheckout = [];
                $.each(val.ecommerce.checkout.products, function (pKey, pVal) {
                    dataLayerCheckout.push(pVal);
});

     var maxProducts = 10;
     if (dataLayerCheckout.length > 0) {
         while (dataLayerCheckout.length) {
             var productObj = dataLayerCheckout.splice(0, maxProducts);
             dataLayer.push({ ecommerce: { checkout: {
                 actionField: { step: checkoutStep },
                 products: productObj }
             },
                 event: 'checkout' });
         }
     }
            });
        }
    });
};

/**
 * A function to handle a click leading to a checkout option selection.
 */
function onCheckoutOption(step, checkoutOption) {

    updateDataLayer('checkoutOption');
    dataLayer.push({
        event: 'checkoutOption',
        ecommerce: {
            checkout_option: {
                actionField: { step: step, option: checkoutOption }
            }
        }
    });
}

/**
 * Custom Start: Create a funtion that trigeer on email subscriptions.
 */

var onEmailSubscribe = function () {
    $('body').on('emailSubscribe:success', function (evt, data) { 
        var userEmailData = JSON.parse(data);
        updateDataLayer('emailSubmit');
        dataLayer.push({
            event: 'emailSubmit',
            User: data
        });
    });
};

/**
 * Custom Start: Create a function that trigger on site search.
 */
var onSiteSearch = function () {
    $('body').on('siteSearch:success', function (evt, data) {
        updateDataLayer('siteSearch');
        dataLayer.push({
            event: 'siteSearch',
            siteSearchTerm: data
        })
    });
};

/**
 * Custom Start: Create a function that trigger on login.
 */
var onLoginIn = function () {
    $('form.login').off('login:success').on('login:success', function (evt, data) {
        var accountLoginLocation = data.accountLoginLocation;
        updateDataLayer('login');
        dataLayer.push({
            event: 'login',
            loginLocation: accountLoginLocation
        });
    });

    $('form.registration').off('registration:success').on('registration:success', function (evt, data) {
        var accountLoginLocation = data.accountLoginLocation;
        updateDataLayer('login');
        dataLayer.push({
            event: 'login',
            loginLocation: accountLoginLocation
        });
    });
};

/**
 * A function to handle a click leading to a checkout option selection.
 */
var onCheckoutOptionOnCart = function (data) {
    updateDataLayer('checkoutOption');
    var checkoutOptionData = $('[data-gtm-shipping-method]').data('gtm-shipping-method');
    if (checkoutOptionData) {
        dataLayer.push({
            event: 'checkoutOption',
            ecommerce: {
                checkout_option: {
                    actionField: { step: data, option: checkoutOptionData}
                }
            }
        });
    }
};

var onQuickViewLoad = function () {
    $('body').on('qv:success', function (evt, data) {
        updateDataLayer('productImpressions');
        dataLayer.push({
            event: 'productDetail',
            ecommerce: {
                detail: {
                    actionField: { list: 'Quick View' },
                    products: [data]
                }
            }
        });
    });
};

var escapeXml = function (value) {
    if (value != null) {
        return value.replace(/%27/g, "\'");
    }
    return value;
};

var carouselAfterChangeEvent = function () {
    var productDataArray = [];
    var currency = '';
    $('.js-carousel').on('afterChange', function (event, slick, currentSlide, nextSlide) {
        slick.$slides.filter('.slick-active').each(function (evt, data) {
            var productData = $(data).find('.gtm-product').data('gtm-facets');
            if (productData) {
                currency = productData.currency;
                productData.list = 'carousel';
                productDataArray.push(productData);
            }
        });
        updateDataLayer('productImpressions');
        dataLayer.push({
            event: 'productImpressions',
            ecommerce: {
                currencyCode: currency,
                impressions: productDataArray
            }
        });
    });
};

var onClickEvents = function () {
    onPromoClickEvent();
    onClickLinkEvent();
    onPDPAddProductClickEvent();
    onProductClickEvent();
    onFacetAndPaginationClick();
    onRemoveFromCartClickEvent();
    onWishlistClickEvent();
    onMorestyleClickEvent();
    onMorestyleLoadEvent();
    onAddtoCartClickEvent();
    onEmailSubscribe();
    onSiteSearch();
    onLoginIn();
};

var onPageLoad = function () {
    updateCheckoutStage();
    onQuickViewLoad();
    getSiteSectionOnPageLoad();
    onPromoImpressionsLoad();
    onLoadProductTile();
    getCookieSessionId();
    $('body').trigger('gtmOnLoadEvents:fired');
};

module.exports = {
    init: function () {
        if (dataLayer && pageDataGTM) {
            onClickEvents();
            onPageLoad();
            carouselAfterChangeEvent();
        }
    }
};
