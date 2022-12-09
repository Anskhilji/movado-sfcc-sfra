'use strict';

/**
 * appends params to a url
 * @param {string} url - Original url
 * @param {Object} params - Parameters to append
 * @returns {string} result url with appended parameters
 */
function appendToUrl(url, params) {
    var newUrl = url;
    newUrl += (newUrl.indexOf('?') !== -1 ? '&' : '?') + Object.keys(params).map(function (key) {
        return key + '=' + encodeURIComponent(params[key]);
    }).join('&');

    return newUrl;
}

/**
 * replace content of modal
 * @param {string} actionUrl - url to be used to remove product
 * @param {string} productID - pid
 * @param {string} productName - product name
 * @param {string} uuid - uuid
 */
function confirmDelete(actionUrl, productID, productName, uuid) {
    var $deleteConfirmBtn = $('.cart-delete-clyde-product-confirmation-btn');
    var $productToRemoveSpan = $('.product-to-remove-clyde');

    $deleteConfirmBtn.data('pid', productID);
    $deleteConfirmBtn.data('action', actionUrl);
    $deleteConfirmBtn.data('uuid', uuid);

    $productToRemoveSpan.empty().append(productName);
}

module.exports = function () {
    $('body').on('click', '.remove-clyde-product', function (e) {
        e.preventDefault();

        var actionUrl = $(this).data('action');
        var productID = $(this).data('pid');
        var productName = $(this).data('name');
        var uuid = $(this).data('uuid');
        confirmDelete(actionUrl, productID, productName, uuid);
    });

    $('body').on('click', '.cart-delete-clyde-product-confirmation-btn', function (e) {
        e.preventDefault();

        var url = $(this).data('action');
        var uuid = $(this).data('uuid');
        var urlParams = {
            uuid: uuid
        };

        url = appendToUrl(url, urlParams);

        $.ajax({
            url: url,
            type: 'post',
            dataType: 'json',
            success: function (data) {
                if (data.success) {
                    if (data.deleteUuid === uuid) {
                        var deleteWarranty = $('.clyde-uuid-' + data.deleteUuid);
                        deleteWarranty.remove();
                        $('.add-clyde-badge-' + data.deleteUuid).removeClass('d-none');
                    }
                }
            }
        });
    });
};
