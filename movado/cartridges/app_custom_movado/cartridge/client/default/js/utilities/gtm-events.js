var cookieHandler = require('./cookieHandler');

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

var onPromoClickEvent = function () {
    $('body').on('click', '.gtm-event', function (evt) {
        var $currentTarget = $(evt.currentTarget);
        updateDataLayer('promoClick');
        var dataLayerObj = [];
        $gtmTrackingData = $(this).data('gtm-tracking');
        if ($gtmTrackingData !== undefined && $gtmTrackingData !== ''){
            dataLayerObj.push($gtmTrackingData);
        }
        dataLayer.push({ event: 'promoClick',
            ecommerce: {
                promoClick: {
                    promotions: dataLayerObj
                }
            }
        });
    });
};

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
		    		   ecommerce: {
					      click: { actionField: { list: val.list },
						     products: [{ name: val.name,
         id: val.id,
         price: val.price,
         brand: val.brand,
         category: val.category,
         position: val.position }]
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
var onPDPAddProductClickEvent = function () {
    $('body').on('addToCart:success', function (evt, data) {
        if ($('[data-action]').data('action') == 'Product-Show') {
            updateDataLayer('addToCart');
            var addtoCartData = JSON.parse(data);
            dataLayer.push({
                event: 'addToCart',
                ecommerce: { currencyCode: addtoCartData.currency,
                    add: { actionField: { list: addtoCartData.list },
				      products: [{
				          id: addtoCartData.id,
				          name: addtoCartData.name,
				          price: addtoCartData.price,
				          category: addtoCartData.category,
				          variant: addtoCartData.variant
				      }]
                    }
                }
            });
        } else if ($('[data-action]').data('action') == 'Search-Show') {
            updateDataLayer('addToCart');
            var addtoCartData = JSON.parse(data);
            dataLayer.push({
                event: 'addToCart',
                ecommerce: { currencyCode: addtoCartData.currency,
                    add: { actionField: { list: addtoCartData.list },
				      products: [{
					          id: addtoCartData.id,
					          name: addtoCartData.name,
					          price: addtoCartData.price,
					          category: addtoCartData.category,
					          variant: addtoCartData.variant
				      	}]
                    }
                }
            });
        }
    });
};
var onAddtoCartClickEvent = function () {
    $('body').on('click', '.gtm-addtocart', function (evt) {
        if ($('[data-action]').data('action') != 'Search-Show') {
            var $currentTarget = $(evt.currentTarget);
            var data = $currentTarget.data('gtm-addtocart');
            updateDataLayer('addToCart');
            dataLayer.push({
                event: 'addToCart',
                ecommerce: { currencyCode: data.currency,
                    add: { actionField: { list: data.list },
                        products: [{
                            id: data.id,
                            name: data.name,
                            price: data.price,
                            category: data.category,
                            variant: data.variant
                        }]
                    }
                }
            });
        }
    });
};

var onRemoveFromCartClickEvent = function () {
    $('body').on('click', '.gtm-cart', function (evt) {
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

var onLoadProductTile = function () {
    updateDataLayer('productImpressions');
    var $currentTarget = $('.gtm-product');
    var dataLayerObj = [];
    var abTestDataLayer = [];
    var currency = '';
    $.each($currentTarget, function () {
        var gtmTrackingData = $(this).data('gtm-facets');
        if (gtmTrackingData !== undefined) {
            dataLayerObj.push({ name: gtmTrackingData.name,
			            id: gtmTrackingData.id,
			            price: gtmTrackingData.price,
			            brand: gtmTrackingData.brand,
			            category: gtmTrackingData.category,
			            position: gtmTrackingData.position,
			            list: gtmTrackingData.list
                    });
            currency = gtmTrackingData.currency;
        }
    });
    var gtmTrackingDataAb = $currentTarget.data('gtm-facets');
    if (gtmTrackingDataAb) {
        abTestDataLayer.push(gtmTrackingDataAb.runningAbTest)
    }
    sliceProductImpressionArray(dataLayerObj, currency, abTestDataLayer);
};

var onPromoImpressionsLoad = function (e) {
    updateDataLayer('promoImpressions');
    var $currentTarget = $('.gtm-event');
    var dataLayerObj = [];
    $.each($currentTarget, function (key, val) {
        var gtmTrackingData = $(this).data('gtm-tracking');
        if (gtmTrackingData !== undefined && gtmTrackingData != '') {
            dataLayerObj.push(gtmTrackingData);
        }
        updateDataLayer('productImpressions');
        dataLayer.push({
            event: 'promoImpressions',
            ecommerce: {
                promoView: {
                    promotions: dataLayerObj
                }
            }
        });
    });
};

var sliceProductImpressionArray = function (e, currency, runningAbTest) {
    if ($('.slick-slider').length) {
        showProductImpressionCaraousel(e, currency, runningAbTest);
    } else {
        var maxProducts = 10;
        updateDataLayer('productImpressions');
        if (e.length > 0) {
            while (e.length) {
                var productObj = e.splice(0, maxProducts);
                dataLayer.push({
                    event: 'productImpressions',
                    ecommerce: {
                        currencyCode: currency,
                        impressions: productObj,
                        runningAbTests: runningAbTest[0]
                    }
                });
            }
        }
    }
};

var showProductImpressionCaraousel = function (e, currency, runningAbTest) {
    var dataProductImpression = {};

    updateDataLayer('productImpressions');
    var productObj = e.splice(0, 3);
    $.each(productObj, function (pKey, pVal) {
        pVal.list = 'carousel';
    });
    dataLayer.push({
        event: 'productImpressions',
        ecommerce: {
            currencyCode: currency,
            impressions: productObj,
            runningAbTests: runningAbTest[0]
        }
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

var getSiteSectionOnPageLoad = function (e) {
    var urlPath = $('[data-url-path-gtm]').data('url-path-gtm');
    var pathName = window.location.pathname.split(urlPath)[1];

    var siteSections = pathName ? pathName.split(/[.?]/)[0].split('/') : '';
    if (pageDataGTM != undefined && pageDataGTM) {
        pageDataGTM.primarySiteSection = siteSections[0] || '';
        pageDataGTM.secondarySiteSection = escapeXml(siteSections[1]) || '';
        pageDataGTM.tertiarySiteSection = siteSections[2] || '';
        dataLayer.push({ pageData: pageDataGTM });
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

    $('body').on('checkOutStage:success', function (evt, data) {
        updateDataLayer('checkout');
        checkoutStage = data;
		 switch (data) {
     case 'shipping':
             checkoutStep = '2';
             pageDataGTM.pageType = 'Checkout – Shipping';
            dataLayer.push({ pageData: pageDataGTM });
            onCheckoutOption(checkoutStep, shippingMethod);
         break;
     case 'payment':
             checkoutStep = '3';
             pageDataGTM.pageType = 'Checkout – Billing';
             dataLayer.push({ pageData: pageDataGTM});
             onCheckoutOption(checkoutStep, shippingMethod);
         break;
     case 'placeOrder':
             checkoutStep = '4';
             checkoutStage = 'Confirm';
             pageDataGTM.pageType = 'Checkout – Review';
             dataLayer.push({ pageData: pageDataGTM});
             if (paymentMethod != undefined) {
                 onCheckoutOption(checkoutStep, paymentMethod);
            }
         break;
     case 'submitted':
        	 checkoutStep = '5';
        	 checkoutStage = 'Confirmation';
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
                 actionField: { step: checkoutStep, option: checkoutStage },
                 products: productObj,
                 runningAbTest: abTestDataLayer
                }
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
 * A function to handle a click leading to a checkout option selection.
 */
function onCheckoutPaymentOption(step, checkoutOption) {
    updateDataLayer('checkoutOption');
    dataLayer.push({
        event: 'checkoutOption',
        ecommerce: {
            checkout_creditPaymentOption: {
                actionField: { step: step, option: checkoutOption }
            }
        }
    });
}

/**
 * A function to handle a click leading to a checkout option selection.
 */
var onCheckoutOptionOnCart = function () {
    updateDataLayer('checkoutOption');
    var checkoutOptionData = $('[data-gtm-shipping-method]').data('gtm-shipping-method');
    if (checkoutOptionData) {
        dataLayer.push({
		    event: 'checkoutOption',
		    ecommerce: {
		      checkout_option: {
		        actionField: { step: 1, option: checkoutOptionData }
		      }
		    }
		  });
    }
};

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
                productDataArray.push({ 
                    name: productData.name,
                    id: productData.id,
                    price: productData.price,
                    brand: productData.brand,
                    category: productData.category,
                    currency: productData.currency
                });
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
};


var onPageLoad = function () {
    updateCheckoutStage();
    onQuickViewLoad();
    getSiteSectionOnPageLoad();
    onPromoImpressionsLoad();
    onLoadProductTile();
    onCheckoutOptionOnCart();
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
