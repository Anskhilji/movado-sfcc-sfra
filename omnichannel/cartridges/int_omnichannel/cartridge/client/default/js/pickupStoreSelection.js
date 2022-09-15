
$(document).ready(function () {
    var $searchStore = $('#search-store');
    $searchStore.click(function () {

        var $zipCode = $('#zip-code');
        var $radius = $('#store-pickup-radius');
        url = $searchStore.data('url');
        data = {
            zipCode: $zipCode.val(),
            radius: $radius.val(),
            isSearch: true
        }
        $('#pickupStoreModal').spinner().start();
        $.ajax({
            url: url,
            type: 'GET',
            data: data,
            success: function (response) {
                $('#store-list').html(response.html);
                $.spinner().stop();
            }, error: function (error) {
                $('#store-list').html('<div class="no-store">'+Resources.BOPIS_STORE_FETCHING_ERROR+'</div>');
                $.spinner().stop();
            }

        })
    })
})

$(function() {
    if (navigator.userAgent.indexOf('Safari') != -1 && navigator.userAgent.indexOf('Chrome') == -1) {
        $('.store-pickup-model').addClass('safari-mac');
    }
});

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
        $('#pickupStoreModal').modal('hide');
        if (storePickup.inventory && storePickup.inventory[0].records[0].ato > 0) {
            $('.pdp-store-pickup-store-icon').addClass('pdp-store-pickup-store-icon-available');
            $('.pdp-icon-box').addClass('pdp-store-pickup-display-inline-block-inventory-icon');
            $('.pdp-icon-box').removeClass('pdp-store-pickup-display-inline-block-store-icon'); 
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


function isIE() {
    ua = navigator.userAgent;
    /* MSIE used to detect old browsers and Trident used to newer ones*/
    var is_ie = ua.indexOf("MSIE ") > -1 || ua.indexOf("Trident/") > -1;
    return is_ie; 
}
  /* Add Class ie-model to adjust the popup if the browser is IE or not */
if (isIE()){
    $('.store-pickup-model .store-pickup-model-container').addClass('ie-model');
} else {
    $('.store-pickup-model .store-pickup-model-container').removeClass('ie-model');
}

$(document).on('click', '.store-hours .store-hours-title', function (){
    var dataAtrribute = $(this).attr('aria-expanded');
    var attrId = $(this).attr('data-target');
    if(dataAtrribute == 'true'){
        $(this).addClass('collapsed').attr({'aria-expanded': 'false'});
        $(attrId).removeClass('show');
    }else{
        $(this).removeClass('collapsed').attr({'aria-expanded': 'true'});
        $(attrId).addClass('show');
  
    }
});
