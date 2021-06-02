
$(document).ready(function () {
    var $searchStore = $("#search-store");
    $searchStore.click(function () {

        var $zipCode = $("#zip-code");
        var $radius = $("#radius");
        url = $searchStore.data('url');
        data = {
            zipCode: $zipCode.val(),
            radius: $radius.val()
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
                $("#store-list").html("<div class='no-store'>We're sorry, we couldn't find results for your search.</div>");
                $.spinner().stop();
            }

        })
    })
})

$(document).on('click', '.store-pickup-select', function () {
    var stringifyData = JSON.stringify($(this).data('store'));
    localStorage.setItem("currentStore", stringifyData);
    console.log(JSON.parse(localStorage.getItem("currentStore")));
    
    var StorePickup = JSON.parse(localStorage.getItem("currentStore"));
    if (StorePickup !=='') {
        try {
            var storeAddress = StorePickup.address1 +' '+ StorePickup.stateCode +' '+ StorePickup.phone;
            $('.available-for-store').text('Available for Store Pickup');
            $('.available-pickup-stores').text(storeAddress);
            $('.pick-up-store-change-store').text('Change');
        } catch (error) {
            console.log(error);
        }
    }
})
