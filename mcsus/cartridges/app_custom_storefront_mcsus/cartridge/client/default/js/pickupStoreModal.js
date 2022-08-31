
$(document).on('click', '.js-store-modal', function (event) {
    event.preventDefault();
    var url = $(this).data('url');
    $.spinner().start();
    $.ajax({
        url: url,
        type: 'GET',
        success: function (response) {
            $('#store-list').html(response.html);
            $('#pickupStoreModal').modal('show');
            $('#store-pickup-radius').val(response.radius || 15);
            $('#zip-code').val(response.zipCode || '');
            if (!response.isPdp) {
                $('.store-list').addClass('store-list-wpdp');
            } else {
                $('.store-list').removeClass('store-list-wpdp');
            }
            $.spinner().stop();
        }, error: function (error) {
            $.spinner().stop();
        }
    })
})