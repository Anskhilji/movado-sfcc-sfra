'use strict';
 // beam charity order

document.addEventListener("beamnonprofitselect", (evt) => {

    var URL = $('.beam-container').val();
    var charityId = evt.detail;
    $.spinner().start();

    $.ajax({
        url: URL,
        method: 'post',
        data: {
            orderId: $('.beam-container').data('order-number'),
            charityId: charityId.selectedNonprofitId
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