
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

$(document).on('click', '.store-pickup-select', function () {
    var stringifyData = JSON.stringify($(this).data('store'));
    if (stringifyData !== '') {
        var storePickup = JSON.parse(stringifyData);
        var storeAddress1 = storePickup.address1;
        var storeAddress = storePickup.address1 + ' ' + storePickup.stateCode + ' ' + storePickup.phone;
        $('.available-for-store, .pick-up-store-available-for-store').text(Resources.BOPIS_STORE_AVAILABLE_TEXT);
        $('.set-your-store').text(storePickup.address1);
        $('.available-pickup-stores, .pick-up-store-available-pickup-stores').text(storeAddress);
        $('.pick-up-store-change-store').text('Change');
        $('#pickupStoreModal').modal('hide');
        setStoreInSession($(this).data('url'), storeAddress1);
    }
})
function setStoreInSession(url, address) {
    url = address ? url+'&storeAddress='+address : url;
    $.ajax({
        url: url,
        type: 'POST',
        success: function (response) {
            $.spinner().stop();
        }, error: function (error) {
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
