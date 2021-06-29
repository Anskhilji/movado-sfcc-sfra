
$(document).on('click', '.js-store-modal', function (event) {
    event.preventDefault();
    $searchStore = $('#search-store');
    var url = $(this).data('url');
    var pid = $searchStore.data('pid');
    $.spinner().start();
    $.ajax({
        url: url,
        data: { pid: pid },
        type: 'GET',
        success: function (response) {
            $('#store-list').html(response.html);
            $('#pickupStoreModal').modal('show');
            $('#store-pickup-radius').val(response.radius || 15);
            $('#zip-code').val(response.zipCode || '');
            $.spinner().stop();
        }, error: function (error) {
            $.spinner().stop();
        }
    })
})