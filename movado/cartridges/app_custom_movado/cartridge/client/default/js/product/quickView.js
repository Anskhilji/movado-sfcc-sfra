'use strict';
var base = require('./base');
var processInclude = require('base/util');
var slickCarousel = require('../components/slickCarousel');
processInclude(require('./productOptionTextValidator'));

/**
 * Generates the modal window on the first call.
 *
 */
function getModalHtmlElement() {
    if ($('#quickViewModal').length !== 0) {
        $('#quickViewModal').remove();
    }
    var htmlString = '<!-- Modal -->'
        + '<div class="modal fade" id="quickViewModal" role="dialog">'
        + '<div class="modal-dialog quick-view-dialog">'
        + '<!-- Modal content-->'
        + '<div class="modal-content">'
        + '<div class="modal-header">'
        + '    <a class="full-pdp-link link" href="">'+ Resources.LINK_QUICKVIEW_VIEWDETAILS +'</a>'
        + '    <button type="button" class="close pull-right" data-dismiss="modal" aria-label="Close">'
        + '      <span class="text-uppercase close-icon">'+ Resources.LINK_QUICKVIEW_CLOSE +'</span>'
        + '    </button>'
        + '</div>'
        + '<div class="modal-body"></div>'
        + '</div>'
        + '</div>';
    $('body').append(htmlString);
}

/**
 * @typedef {Object} QuickViewHtml
 * @property {string} body - Main Quick View body
 * @property {string} footer - Quick View footer content
 */

/**
 * Parse HTML code in Ajax response
 *
 * @param {string} html - Rendered HTML from quickview template
 * @return {QuickViewHtml} - QuickView content components
 */
function parseHtml(html) {
    var $html = $('<div>').append($.parseHTML(html));

    var body = $html.find('.product-quickview');
    var footer = $html.find('.modal-footer').children();

    return { body: body, footer: footer };
}

/**
 * replaces the content in the modal window on for the selected product variation.
 * @param {string} selectedValueUrl - url to be used to retrieve a new product model
 */
function fillModalElement(selectedValueUrl, gtmProdObj) {
    $('#quickViewModal .modal-body').spinner().start();
    $.ajax({
        url: selectedValueUrl,
        method: 'GET',
        dataType: 'json',
        success: function (data) {
        	$('body').trigger('qv:success', gtmProdObj);
            var parsedHtml = parseHtml(data.renderedTemplate);
            var loggedInStatusUrl = $('.product-tile').data('loggedin-status-url'); 
            var loggedIn;
            var restrictAnonymousUsersOnSalesSites;

            $('#quickViewModal .modal-body').empty();
            $('#quickViewModal .modal-body').html(parsedHtml.body);
            $('#quickViewModal .modal-footer').html(parsedHtml.footer);
            $('#quickViewModal .full-pdp-link').attr('href', data.productUrl);
            $('#quickViewModal .size-chart').attr('href', data.productUrl);
            $('#quickViewModal .gtm-addtocart').attr('data-gtm-addtocart', JSON.stringify(data.productGtmArray));
            if (loggedInStatusUrl) {
                $.ajax({
                    url: loggedInStatusUrl,
                    success: function (data){
                        loggedIn = data.loggedIn;
                        restrictAnonymousUsersOnSalesSites = data.restrictAnonymousUsersOnSalesSites;
                        if (restrictAnonymousUsersOnSalesSites) {
                            if (!loggedIn) {
                                $('.prices-add-to-cart-actions.mcs-add-to-cart').hide();
                                $('.prices-add-to-cart-actions.mcs-show-price-message').removeClass('d-none');
                                $('.mcs-restrict-anonymous-user').hide();
                            } else {
                                $('.prices-add-to-cart-actions.mcs-add-to-cart').show();
                                $('.prices-add-to-cart-actions.mcs-show-price-message').addClass('d-none');
                                $('.mcs-restrict-anonymous-user').show();
                            }
                        }
                        $('#quickViewModal').modal('show');
                    },
                    error: function (error) {
                        $('#quickViewModal').modal('show');
                    }
                });
            } else {
                $('#quickViewModal').modal('show');
            }

            setTimeout(function () {
                slickCarousel.initCarousel($('#quickViewModal .product-quickview'));
                //Custom Start: Adding ESW Code Logic
                if (typeof data.eswModuleEnabled !== undefined) {
                    if (data.eswModuleEnabled) {
                        // Remote Include call For List Price
                        var $eswListPriceSelector = $('.modal.show').find('.eswListPrice');
                        eswConvertPrice($eswListPriceSelector); // eslint-disable-line no-undef
                        // Remote Include call For Sales Price
                        var $eswPriceSelector = $('.modal.show').find('.eswPrice');
                        eswConvertPrice($eswPriceSelector); // eslint-disable-line no-undef
                    }
                }
                //Custom End
            }, 1000);
            if (Resources.AFFIRM_PAYMENT_METHOD_STATUS) {
                if (document.readyState === 'complete') {
                    affirm.ui.refresh();
                }
            }
            $.spinner().stop();
            if(data.isanalyticsTrackingEnabled && data.pdpAnalyticsTrackingData && typeof setAnalyticsTrackingByAJAX != 'undefined') {
                setAnalyticsTrackingByAJAX.pdpAnalyticsTrackingData = data.pdpAnalyticsTrackingData;
                window.dispatchEvent(setAnalyticsTrackingByAJAX);
            }
        },
        error: function () {
            $.spinner().stop();
        }
    });
}

module.exports = {
    showQuickview: function () {
        $('body').on('click', '.quickview', function (e) {
            e.preventDefault();
            var selectedValueUrl = $(this).closest('a.quickview').attr('href');
            var gtmProdObj = $(this).closest('a.quickview').attr('data-gtm-qv');
            getModalHtmlElement();
            $(e.target).trigger('quickview:show');
            if (gtmProdObj) {
                fillModalElement(selectedValueUrl, JSON.parse(gtmProdObj));
            }
        });
    },
    colorAttribute: base.colorAttribute,
    selectAttribute: base.selectAttribute,
    removeBonusProduct: base.removeBonusProduct,
    selectBonusProduct: base.selectBonusProduct,
    enableBonusProductSelection: base.enableBonusProductSelection,
    showMoreBonusProducts: base.showMoreBonusProducts,
    addBonusProductsToCart: base.addBonusProductsToCart,
    availability: base.availability,
    addToCart: base.addToCart,
    showSpinner: function () {
        $('body').on('product:beforeAddToCart', function (e, data) {
            $(data).closest('.modal-content').spinner().start();
        });
    },
    hideDialog: function () {
        $('body').on('product:afterAddToCart', function () {
            $('#quickViewModal').modal('hide');
        });
    },
    beforeUpdateAttribute: function () {
        $('body').on('product:beforeAttributeSelect', function () {
            $('.modal.show .modal-content').spinner().start();
        });
    },
    updateAttribute: function () {
        $('body').on('product:afterAttributeSelect', function (e, response) {
            if ($('.modal.show .product-quickview>.bundle-items').length) {
                $('.modal.show').find(response.container).data('pid', response.data.product.id);
                $('.modal.show').find(response.container)
                    .find('.product-id').text(response.data.product.id);
            } else if ($('.set-items').length) {
                response.container.find('.product-id').text(response.data.product.id);
            } else {
                $('.modal.show .product-quickview').data('pid', response.data.product.id);
                $('.modal.show .full-pdp-link')
                    .attr('href', response.data.product.selectedProductUrl);
            }

            //Custom Start: Adding ESW Code Logic
            if (response.data.product.isProductRestricted) {
                $('.modal.show').find('button.add-to-cart-global').addClass('d-none');
                $('.modal.show').find('.price').addClass('d-none');
                $('.modal.show').find('.product-not-available-msg').removeClass('d-none');
            } else {
                $('.modal.show').find('button.add-to-cart-global').removeClass('d-none');
                $('.modal.show').find('.price').removeClass('d-none');
                $('.modal.show').find('.product-not-available-msg').addClass('d-none');
            }

            //Custom Start: Adding ESW Code Logic
            if (typeof response.data.eswModuleEnabled !== undefined) {
                if (response.data.eswModuleEnabled) {
                    // Remote Include call For List Price
                    var $eswListPriceSelector = $('.modal.show').find('.eswListPrice', response.container).length ? $('.modal.show').find('.eswListPrice', response.container) : $('.modal.show').find('.eswListPrice');
                    eswConvertPrice($eswListPriceSelector); // eslint-disable-line no-undef
                    // Remote Include call For Sales Price
                    var $eswPriceSelector = $('.modal.show').find('.eswPrice', response.container).length ? $('.modal.show').find('.eswPrice', response.container) : $('.modal.show').find('.eswPrice');
                    eswConvertPrice($eswPriceSelector); // eslint-disable-line no-undef
                }
            }
            //Custom End
        });
    },
    updateAddToCart: function () {
        $('body').on('product:updateAddToCart', function (e, response) {
            // update local add to cart (for sets)
            $('button.add-to-cart', response.$productContainer).attr('disabled',
                (!response.product.readyToOrder || !response.product.available));

            // update global add to cart (single products, bundles)
            var dialog = $(response.$productContainer)
                .closest('.quick-view-dialog');

            $('.add-to-cart-global', dialog).parent().toggleClass('d-none',
                !$('.global-availability', dialog).data('ready-to-order')
                || !$('.global-availability', dialog).data('available')
            );
        });
    },
    updateAvailability: function () {
        $('body').on('product:updateAvailability', function (e, response) {
            // bundle individual products
            $('.product-availability', response.$productContainer)
                .data('ready-to-order', response.product.readyToOrder)
                .data('available', response.product.available)
                .find('.availability-msg')
                .empty()
                .html(response.message);


            var dialog = $(response.$productContainer)
                .closest('.quick-view-dialog');

            if ($('.product-availability', dialog).length) {
                // bundle all products
                var allAvailable = $('.product-availability', dialog).toArray()
                    .every(function (item) { return $(item).data('available'); });

                var allReady = $('.product-availability', dialog).toArray()
                    .every(function (item) { return $(item).data('ready-to-order'); });

                $('.global-availability', dialog)
                    .data('ready-to-order', allReady)
                    .data('available', allAvailable);

                $('.global-availability .availability-msg', dialog).empty()
                    .html(allReady ? response.message : response.resources.info_selectforstock);
            } else {
                // single product
                $('.global-availability', dialog)
                    .data('ready-to-order', response.product.readyToOrder)
                    .data('available', response.product.available)
                    .find('.availability-msg')
                    .empty()
                    .html(response.message);
            }
        });
    }
};
