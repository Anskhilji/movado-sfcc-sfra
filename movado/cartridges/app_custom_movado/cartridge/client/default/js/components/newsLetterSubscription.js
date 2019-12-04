'use strict';
var wrapperContainer = $('.submission-status');
function processSubscription(response) {
    $.spinner().stop();
    if ((typeof (response) === 'object')) {
        wrapperContainer.removeClass('d-none');
        $('.submission-status div').text(response.message);
        if (!response.error) {
            $('.submission-status div').attr('class', 'success');
            $('#add-to-email-list').prop('checked', response.customerFound);
            if(response.isanalyticsTrackingEnabled && response.userTracking) {
                setAnalyticsTrackingByAJAX.userTracking = response.userTracking;
                window.dispatchEvent(setAnalyticsTrackingByAJAX);
            }
        } else {
            $('.submission-status div').attr('class', 'error');
        }
    }
}
$(document).ready(function () {
    $('#newsletterSubscribe').submit(function (e) {
        e.preventDefault();
        wrapperContainer.addClass('d-none');
        var endPointUrl = $(e.target).attr('action');
        var inputValue = $(e.target).find('.form-control').val();
        if (inputValue !== '') {
            var pattern = /^\b[A-Z0-9._%-]+@[A-Z0-9.-]+\.[A-Z]{2,4}\b$/i
                if(!pattern.test(inputValue)) {
                    wrapperContainer.removeClass('d-none');
                    $('.submission-status div').text(Resources.INVALID_EMAIL_ERROR).attr('class', 'error');
                } else {
                    $.spinner().start();
                    $.ajax({
                        url: endPointUrl,
                        method: 'POST',
                        data: { email: inputValue },
                        success: processSubscription,
                        error: function () { $.spinner().stop(); }
                    });
                }
        } else {
            wrapperContainer.removeClass('d-none');
            $('.submission-status div').text(wrapperContainer.data('errormsg')).attr('class', 'error');
        }
    });
});
