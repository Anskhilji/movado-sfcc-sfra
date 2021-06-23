
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
        $.spinner().start();
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

$(document).on('click', '.store-pickup-select', function () {
    var stringifyData = JSON.stringify($(this).data('store'));
    if (stringifyData !== '') {
        var storePickup = JSON.parse(stringifyData);
        var storeAddress = (storePickup.address1 || '') + ' ' + (storePickup.stateCode || '') + ' ' + (storePickup.phone || '');
        $('.available-for-store, .pick-up-store-available-for-store').text(Resources.BOPIS_STORE_AVAILABLE_TEXT);
        $('.set-your-store').text(storePickup.address1);
        $('.available-pickup-stores, .pick-up-store-available-pickup-stores').text(storeAddress);
        $('.pick-up-store-change-store').text('Change');
        $('#pickupStoreModal').modal('hide');
        if (storePickup.inventory && storePickup.inventory[0].records[0].reserved > 0) {
            $('.pdp-store-pickup-store-icon').addClass('pdp-store-pickup-store-icon-available')
        }
        if ($('.pickup-store-cart-address').length) {
            setStoreInSession($(this).data('url'), true);
        } else {
            setStoreInSession($(this).data('url'), false);
        }

    }
})

function setStoreInSession(url, isFromCart) {

    $.ajax({
        url: url,
        type: 'POST',
        success: function (response) {
            if (isFromCart) {
                window.location.reload();
            }
            $.spinner().stop();
        }, error: function (error) {
            $.spinner().stop();
        }

    })
}
