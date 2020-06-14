'use strict';

var baseQuickView = require('base/product/quickView');

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
        + '<span class="enter-message sr-only" ></span>'
        + '<div class="modal-dialog quick-view-dialog">'
        + '<!-- Modal content-->'
        + '<div class="modal-content">'
        + '<div class="modal-header">'
        + '    <a class="full-pdp-link" href=""></a>'
        + '    <button type="button" class="close pull-right" data-dismiss="modal">'
        + '        <span aria-hidden="true">&times;</span>'
        + '        <span class="sr-only"> </span>'
        + '    </button>'
        + '</div>'
        + '<div class="modal-body"></div>'
        + '<div class="modal-footer"></div>'
        + '</div>'
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
 * @param {function} callback - The Callback function
 */
function fillModalElement(selectedValueUrl, callback) {
    $('.modal-body').spinner().start();
    $.ajax({
        url: selectedValueUrl,
        method: 'GET',
        dataType: 'json',
        success: function (data) {
            var parsedHtml = parseHtml(data.renderedTemplate);

            $('.modal-body').empty();
            $('.modal-body').html(parsedHtml.body);
            $('.modal-footer').html(parsedHtml.footer);
            $('.full-pdp-link').text(data.quickViewFullDetailMsg);
            $('#quickViewModal .full-pdp-link').attr('href', data.productUrl);
            $('#quickViewModal .size-chart').attr('href', data.productUrl);
            $('#quickViewModal .modal-header .close .sr-only').text(data.closeButtonText);
            $('#quickViewModal .enter-message').text(data.enterDialogMessage);
            $('#quickViewModal').modal('show');

            if (typeof callback !== undefined) callback();
            $.spinner().stop();
        },
        error: function () {
            $.spinner().stop();
        }
    });
}

baseQuickView.showQuickview = function () {
    $('body').on('click', '.quickview', function (e) {
        e.preventDefault();
        var selectedValueUrl = $(this).closest('a.quickview').attr('href');
        $(e.target).trigger('quickview:show');
        getModalHtmlElement();

        fillModalElement(selectedValueUrl, function () {
            // Remote Include call For List Price
            var $eswListPriceSelector = $('.modal.show').find('.eswListPrice');
            eswConvertPrice($eswListPriceSelector); // eslint-disable-line no-undef

            // Remote Include call For Sales Price
            var $eswPriceSelector = $('.modal.show').find('.eswPrice');
            eswConvertPrice($eswPriceSelector); // eslint-disable-line no-undef
        });
    });
};

baseQuickView.updateAttribute = function () {
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

        if (response.data.product.isProductRestricted) {
            $('.modal.show').find('button.add-to-cart-global').addClass('d-none');
            $('.modal.show').find('.price').addClass('d-none');
            $('.modal.show').find('.product-not-available-msg').removeClass('d-none');
        } else {
            $('.modal.show').find('button.add-to-cart-global').removeClass('d-none');
            $('.modal.show').find('.price').removeClass('d-none');
            $('.modal.show').find('.product-not-available-msg').addClass('d-none');
        }

        // Remote Include call For List Price
        var $eswListPriceSelector = $('.modal.show').find('.eswListPrice', response.container).length ? $('.modal.show').find('.eswListPrice', response.container) : $('.modal.show').find('.eswListPrice');
        eswConvertPrice($eswListPriceSelector); // eslint-disable-line no-undef

        // Remote Include call For Sales Price
        var $eswPriceSelector = $('.modal.show').find('.eswPrice', response.container).length ? $('.modal.show').find('.eswPrice', response.container) : $('.modal.show').find('.eswPrice');
        eswConvertPrice($eswPriceSelector); // eslint-disable-line no-undef
    });
};

module.exports = baseQuickView;
