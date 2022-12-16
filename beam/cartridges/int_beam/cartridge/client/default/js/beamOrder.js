'use strict';
 // beam charity order

document.addEventListener("beamnonprofitselect", (evt) => {

    var URL = $('.beam-container').val();
    var chairtyId = evt.detail;
    $.spinner().start();

    $.ajax({
        url: URL,
        method: 'post',
        data: {
            orderId: $('.beam-container').data('order-number'),
            chairtyId: chairtyId.selectedNonprofitId
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
// end beam cutom code