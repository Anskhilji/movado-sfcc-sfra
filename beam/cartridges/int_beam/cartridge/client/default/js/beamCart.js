$('body').on('click','.beam-widget-mini-cart', function() {

    var URL = $('.beam-widget-minicart').val();
    var chairtyId = $(this).attr('selectednonprofitid');
    $.spinner().start();

    $.ajax({
        url: URL,
        method: 'post',
        data: {
            chairtyId: chairtyId
        },
        success: function (data) {
            if (data) {
                $.spinner().stop();
            }
        },
        error: function (err) {
            $.spinner().stop();
        }
    });
});

$('body').on('click','.beam-widget-cart', function() {

    var URL = $('.beam-widget-minicart').val();
    var chairtyId = $(this).attr('selectednonprofitid');
    $.spinner().start();

    $.ajax({
        url: URL,
        method: 'post',
        data: {
            chairtyId: chairtyId
        },
        success: function (data) {
            if (data) {
                $.spinner().stop();
            }
        },
        error: function (err) {
            $.spinner().stop();
        }
    });
});