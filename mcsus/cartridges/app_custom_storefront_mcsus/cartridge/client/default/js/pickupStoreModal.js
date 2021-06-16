
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
            $('#radius').val(response.radius || 15);
            $('#zip-code').val(response.zipCode || '');
            $.spinner().stop();
        }, error: function (error) {
            $.spinner().stop();
        }
    })
})