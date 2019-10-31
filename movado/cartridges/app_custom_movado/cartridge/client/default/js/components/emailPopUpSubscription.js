'use strict';
var wrapperContainer = $('.email-pop-up-submission-status');
function processSubscription(response) {
    if ((typeof (response) === 'object')) {
        wrapperContainer.removeClass('d-none');
        $('.submission-status div').text(response.message);
        if (!response.error) {
            $('.submission-status div').attr('class', 'success');
            $('#add-to-email-list').prop('checked', response.customerFound);
            hideEmailPopUpModal();
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
    $('#emailPopUpSubscribe').submit(function (e) {
        e.preventDefault();
        wrapperContainer.addClass('d-none');
        var endPointUrl = $(e.target).attr('action');
        var inputValue = $(e.target).find('.form-control').val();
        if (inputValue !== '') {
            $.ajax({
                url: endPointUrl,
                method: 'POST',
                data: { email: inputValue },
                success: processSubscription,
                error: function () { 
                    wrapperContainer.removeClass('d-none');
                    $('.submission-status div').text(Resources.EMAIL_POPUP_SERVER_ERROR_MSG).attr('class', 'error');
                }
            });
            
        } else {
            wrapperContainer.removeClass('d-none');
            $('.submission-status div').text(wrapperContainer.data('errormsg')).attr('class', 'error');
        }
    });
});

// Hide email pop up 
function hideEmailPopUpModal() {
    $('.email-optin-control').addClass('d-none');
    $('.thankyou-note-control').removeClass('d-none');
    $('.email-popup .modal-dialog').removeClass('quick-view-dialog email-popup-container').addClass('modal-sm');
    $('.email-popup .modal-dialog').width('60%');
    $('.email-popup .modal-dialog').height('30%');
    $(".email-popup").addClass('thankyou-opened');
    var thankYouNoteColor = $('.email-popup').data('thankyounotecolor');
    if (thankYouNoteColor) {
        $('.email-popup .modal-dialog .email-popup-content').css('background', thankYouNoteColor);
    }
    setTimeout(function() { 
        $(".thankyou-opened").click( function() {
            $('.thankyou-opened').hide();
        });
    }, 200);
}