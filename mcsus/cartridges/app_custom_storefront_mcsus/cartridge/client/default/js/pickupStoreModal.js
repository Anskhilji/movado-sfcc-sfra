
$(document).on('click', '.storeModal', function () {
    var url = $(this).data('url');
    $.spinner().start();
    $.ajax({
        url: url,
        type: 'GET',
        success: function (resData) {
            $("#store-list").html(resData.html);
            $("#pickupStoreModal").modal('show');
            $("#radius").val(resData.radius || 15);
            $("#zip-code").val(resData.zipCode || '');
            $.spinner().stop();
        }, error: function (error) {
            $("#pickupStoreModal").modal('show');
            $("#radius").val(resData.radius || 15);
            $("#zip-code").val(resData.zipCode || '');
            $("#store-list").html("<div class='no-store'>"+Resources.BOPIS_STORE_FETCHING_ERROR+"</div>");
            $.spinner().stop();
        }

    })
})