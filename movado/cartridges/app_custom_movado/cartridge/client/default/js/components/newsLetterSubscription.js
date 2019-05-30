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
            $.spinner().start();
            $.ajax({
                url: endPointUrl,
                method: 'POST',
                data: { email: inputValue },
                success: processSubscription,
                error: function () { $.spinner().stop(); }
            });
        } else {
            wrapperContainer.removeClass('d-none');
            $('.submission-status div').text(wrapperContainer.data('errormsg')).attr('class', 'error');
        }
    });
});
