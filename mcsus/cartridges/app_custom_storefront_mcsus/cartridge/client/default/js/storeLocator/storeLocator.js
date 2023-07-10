var processInclude = require('base/util');

processInclude(require('movado/storeLocator/storeLocator'));

/* globals google */
'use strict';


window.onSubmitCaptchaG = function (token) {
    $(document).ready(function () {
        var $submitForm = $('.button-search');
        var $gCaptchaInput = $('.g-recaptcha-token')
        $($gCaptchaInput).val(token);
        $($submitForm).click(); 
    });
}

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

function getFilterValues() {
    var searchValue = $('.search-input').val().trim();
    var radius = $('input[name="radio"]:checked').val();
    var googleRecaptchaToken = $('.g-recaptcha-token').val();
    if (!radius && sessionStorage.getItem('radius') === null) {
        $('input[name="radio"][value=15]').prop('checked', true);
    }

    if (searchValue) {
        sessionStorage.setItem("address", searchValue);
    } else {
        searchValue = sessionStorage.getItem("address");
    }

    if (radius) {
        sessionStorage.setItem("radius", radius);
    } else {
        radius = sessionStorage.getItem("radius");
        $('input[name="radio"][value='+radius+']').prop('checked', true);
    }

    if (googleRecaptchaToken) {
        sessionStorage.setItem('googleRecaptchaToken', googleRecaptchaToken);
    } else {
        googleRecaptchaToken = sessionStorage.getItem('googleRecaptchaToken');
    }

    return {
        searchValue: searchValue,
        radius: radius,
        googleRecaptchaToken: googleRecaptchaToken
    }
}

function setHours() {
    $('.store-sidebar-card').each(function () {
        var $card = $(this);
        var $selectTime = $card.find('.select-time');
        var $selectTimeDropdown = $card.find('.select-time-dropdwon');

        $selectTime.on('click', function () {
            $selectTimeDropdown.toggleClass('show');
            $selectTime.toggleClass('active');
        });
    });
};

function closeStoreLocator() {
    $('.radius-sidebar').removeClass('show');
    $('.store-sidebar').removeClass('hide-scroll');
    $('.store-sidebar').removeClass('show');
    $('.store-Locator-overlayer').removeClass('d-block');
}

function selectStoreIcon() {
    $(document).on('click', '.store-pickup-select', function () {
        var stringifyData = JSON.stringify($(this).data('store'));
        if (stringifyData !== '') {
            var storePickup = JSON.parse(stringifyData);
            var storeAddress1 = storePickup.address1;
            var storeAddress2 = storePickup.address2;
            var storePostalCode = storePickup.postalCode;
            var storeAddress = storePickup.address1 + ' ' + (storePickup.stateCode != undefined ? storePickup.stateCode + ' ' : '') + (storePostalCode != undefined ? storePostalCode : '');
            var stateCode = storePickup.stateCode;
            var storeCity = storePickup.city;
            var storeCountryCode = storePickup.countryCode;
            $('.available-for-store, .pick-up-store-available-for-store').text(Resources.BOPIS_STORE_AVAILABLE_TEXT);
            $('.set-your-store').text(storePickup.address1);
            $('.available-pickup-stores, .pick-up-store-available-pickup-stores').text(storeAddress);
            $('.pick-up-store-change-store').text('Change');
            closeStoreLocator();
            if (storePickup.inventory && storePickup.inventory[0].records[0].ato > 0) {
                $('.pdp-store-pickup-store-icon').addClass('pdp-store-pickup-store-icon-available');
                $('.pdp-icon-box').addClass('pdp-store-pickup-display-inline-block-inventory-icon');
                $('.pdp-icon-box').removeClass('pdp-store-pickup-display-inline-block-store-icon');
            } else if (storePickup.inventory === undefined || storePickup.inventory[0].records[0].ato === 0) {
                $('.pdp-icon-box').removeClass('pdp-store-pickup-display-inline-block-store-icon');
                $('.pdp-icon-box').removeClass('pdp-store-pickup-display-inline-block-inventory-icon');
                $('.pdp-icon-box').addClass('pickup-store-inventory-status-icon-unavailable unavailable-icon-block');
                $('.available-for-store, .pick-up-store-available-for-store').text(Resources.BOPIS_STORE_UNAVAILABLE_TEXT);
            } else {
                $('.pdp-icon-box').addClass('pdp-store-pickup-display-inline-block-store-icon');
            }
            if ($('.pickup-store-cart-address').length) {
                setStoreInSession($(this).data('url'), storeAddress1, stateCode, storePostalCode, storeCity, storeCountryCode, storeAddress2, true);
            } else {
                setStoreInSession($(this).data('url'), storeAddress1, stateCode, storePostalCode, storeCity, storeCountryCode, storeAddress2, false);
            }
        }
    })

    function setStoreInSession(url, address, stateCode, storePostalCode, storeCity, storeCountryCode, storeAddress2, isFromCart) {
        url = address ? url + '&storeAddress=' + address : url;
        url = stateCode ? url + '&stateCode=' + stateCode : url;
        url = storePostalCode ? url + '&storePostalCode=' + storePostalCode : url;
        url = storeCity ? url + '&storeCity=' + storeCity : url;
        url = storeCountryCode ? url + '&storeCountryCode=' + storeCountryCode : url;
        url = storeAddress2 ? url + '&storeAddress2=' + storeAddress2 : url;
        $.ajax({
            url: url,
            type: 'POST',
            success: function (response) {
                if (isFromCart) {
                    window.location.reload();
                }
                $.spinner().stop();
            },
            error: function (error) {
                $.spinner().stop();
            }

        })
    }
};

function showMore() {
    var count = $('.show-more-button').data('store-count');
    var divLength = $(".store-sidebar-card").length;
    if (count >= divLength) {
        $('.show-more-button').hide();
    }
    $('.store-sidebar-card').slice(0, count).show();
    $('.show-more-button').on('click', function (e) {
        $.spinner().start();
        e.preventDefault();
        var count = $(this).data('store-count');
        var divLength = $(".store-sidebar-card").length;
        if (count + 5 >= divLength) {
            $('.show-more-button').hide();
        }
        count = count + 5 <= divLength ? count + 5 : divLength;
        $(this).data('store-count', count);
        $('.store-sidebar-card').slice(0, count).show();
        $.spinner().stop();
    });
};

function searchLocator(url) {
    $.spinner().start();
    $.ajax({
        url: url,
        method: 'GET',
        success: function (data) {
            $('.store-results-box').empty().html(data.html);
            $(".store-sidebar-card").hide();
            setHours();
            selectStoreIcon();
            showMore();
            getFilterValues();
            closefilter();
            searchWithin();
            $.spinner().stop();
        },
        error: function (err) {
            $.spinner().stop();
        }
    });
};

function searchWithin() {
    $('.search-within').on('click', function () {
        var url = $(this).data('action');
        var searchValue = $('.search-input').val().trim();
        var radius = $(this).data('radius-value');
        $('input[name="radio"]').prop('checked', true);
        $('input[name="radio"][value='+radius+']').prop('checked', true);
        if (radius) {
            urlParams = {
                radius: radius,
                address: searchValue
            };
            url = appendToUrl(url, urlParams);
        }
        searchLocator(url);
    });

}

function closefilter() {
    $('.ftr-close').on('click', function () {
        sessionStorage.removeItem('radius');
        $('input[name="radio"]').prop('checked', false);
        getFilterValues();
        $('.store-sidebar-link').click();
        $.spinner().stop();
        $('.button-search').click();
    });
};

$('.store-sidebar-link').on('click', function () {
    $('.store-sidebar').addClass('show');
    $('.store-Locator-overlayer').addClass('d-block');
    var url = $(this).data('action');
    var searchFilter = getFilterValues();
    var urlParams = {};
    if (searchFilter.searchValue) {
        urlParams.address = searchFilter.searchValue;
        $('.search-input').val(sessionStorage.getItem("address"));
    }
    searchFilter.radius ? urlParams.radius = searchFilter.radius : null;
    searchFilter.googleRecaptchaToken ? urlParams.googleRecaptchaToken = searchFilter.googleRecaptchaToken : null;
    url = appendToUrl(url, urlParams);
    searchLocator(url);
});

$('.button-search').on('click', function () {
    var searchValue = $('.search-input').val().trim();
    var recaptchaToken = $('.g-recaptcha-token').val();
    sessionStorage.setItem('address', searchValue);
    sessionStorage.setItem('recaptchaToken', recaptchaToken);
    var searchFilter = getFilterValues();
    var url = $(this).data('action');
    var urlParams = {};
    searchFilter.searchValue ? urlParams.address = searchFilter.searchValue : null;
    searchFilter.radius ? urlParams.radius = searchFilter.radius : null;
    searchFilter.googleRecaptchaToken ? urlParams.googleRecaptchaToken = searchFilter.googleRecaptchaToken : null;
    url = appendToUrl(url, urlParams);
    searchLocator(url);
});

$(".search-input").keyup(function (event) {
    if (event.keyCode === 13) {
        $('.button-search').click();
    }
});

$('.store-sidebar-header-close').on('click', function () {
    $('.store-sidebar').removeClass('show');
    $('.store-Locator-overlayer').removeClass('d-block');
});

$('.filter-button').on('click', function () {
    $('.store-sidebar').addClass('hide-scroll');
    $('.radius-sidebar').addClass('show');
});

$('.radius-sidebar-header-title').on('click', function () {
    $('.store-sidebar').removeClass('hide-scroll');
    $('.radius-sidebar').removeClass('show');
});

$('.store-Locator-overlayer').on('click', function () {
    closeStoreLocator();
});

$('.miles-action-btn-apply').on('click', function () {
    var url = $(this).data('action');
    var searchFilter = getFilterValues();
    var urlParams = {};
    searchFilter.searchValue ? urlParams.address = searchFilter.searchValue : null;
    searchFilter.radius ? urlParams.radius = searchFilter.radius : null;
    searchFilter.googleRecaptchaToken ? urlParams.googleRecaptchaToken = searchFilter.googleRecaptchaToken : null;
    url = appendToUrl(url, urlParams);
    searchLocator(url);
    $('.radius-sidebar').removeClass('show');
    $('.store-sidebar').removeClass('hide-scroll');
});

$('.miles-action-btn-clear').on('click', function () {
    sessionStorage.removeItem('radius');
    $('input[name="radio"]').prop('checked', false);
    getFilterValues();
    $('.store-sidebar-link').click();
    $('.radius-sidebar').removeClass('show');
    $('.store-sidebar').removeClass('hide-scroll');
});
