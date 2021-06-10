
$(document).ready(function () {
    var $searchStore = $("#search-store");
    $searchStore.click(function () {

        var $zipCode = $("#zip-code");
        var $radius = $("#radius");
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
            success: function (resData) {
                $("#store-list").html(resData.html);
                $.spinner().stop();
            }, error: function (error) {
                $("#store-list").html("<div class='no-store'>"+Resources.BOPIS_STORE_FETCHING_ERROR+"</div>");
                $.spinner().stop();
            }

        })
    })
})

$(document).on('click', '.store-pickup-select', function () {
    var stringifyData = JSON.stringify($(this).data('store'));
    localStorage.setItem("currentStore", stringifyData);
    var StoreJson = localStorage.getItem("currentStore");
    if (StoreJson !== '') {
        var StorePickup = JSON.parse(StoreJson);
        var storeAddress = StorePickup.address1 + ' ' + StorePickup.stateCode + ' ' + StorePickup.phone;
        $('.available-for-store').text('Available for Store Pickup');
        $('.set-your-store').text(StorePickup.address1);
        $('.available-pickup-stores').text(storeAddress);
        $('.pick-up-store-change-store').text('Change');
        $('#pickupStoreModal').modal('hide');
        setStoreInSession($(this).data('url'))
    }
})

function setStoreInSession(url) {

    $.ajax({
        url: url,
        type: 'POST',
        success: function (resData) {
            $.spinner().stop();
        }, error: function (error) {
            $.spinner().stop();
        }

    })
}
