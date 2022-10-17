'use strict';

var formHelpers = require('../checkout/formErrors');

/**
 * To open the SendToFriend Modal.
 */
function share() {
    $('body').on('click', '.wishlist-share', function (evt) {
        evt.preventDefault();
        var endPointUrl = $(evt.target).closest('a').attr('href');
        $.spinner().start();
        formHelpers.clearPreviousErrors('#sharewishlistform');
        $.ajax({
            url: endPointUrl,
            type: 'get',
            success: function (response) {
                $('#sharewishlistform').find('.modal-content').html(response);
                $('.server-error').hide();
                $('.modal-title-review').hide();
                $('.modal-title-sendtofriend').show();
                $('.review-headline').hide();
                $('.firstPart').show();
                $('.send-to-friend-product').show();
                $('.other').show();
                $('.message-sent').hide();
                $('#sendtofriend-preview').hide();
                $.spinner().stop();
            }
        });
    });
}

/**
 * Send the data from Modal to the user.
 */
function send() {
    $('body').on('click', '#sharewishlistformsend', function (e) {
        e.preventDefault();
        $.spinner().start();
        formHelpers.clearPreviousErrors('#sharewishlistform');
        var form = $('form.sendtofriend');
        var endPointUrl = form.attr('action');
        $.ajax({
            url: endPointUrl,
            type: 'post',
            dataType: 'json',
            data: form.serialize(),
            success: function (data) {
                if (!data.error && !data.serverError) {
                    $('.modal-title-sendtofriend').show();
                    $('.modal-title-review').hide();
                    $('.review-headline').hide();
                    $('.send-to-friend-product').hide();
                    $('.firstPart').hide();
                    $('.other').hide();
                    $('.message-sent').show();
                    $('#sendtofriend-preview').hide();
                } else if (data.error) {
                    formHelpers.loadFormErrors('.sendtofriend', data.fields);
                } else if (data.serverError) {
                    $('.server-error').html(data.serverErrorMessage);
                }
                $.spinner().stop();
            },
            error: function (data) {
                formHelpers.loadFormErrors('.sendtofriend', data.fields);
                $.spinner().stop();
            }
        });
    });
}

/**
 * Setting preview values.
 */
function formPreview(form) {
    $('.preview-friendsname').html(form.find('#friendsname').val());
    $('.preview-friendsemail').html(form.find('#friendsemail').val());
    $('.preview-from').html(form.find('#yourname').val());
    $('.preview-youremail').html(form.find('#youremail').val());
    $('.preview-message').html(form.find('#message').val());
}

/**
 * Set up the preview modal window.
 */
function preview() {
    $('body').on('click', '#sendtofriendformpreview', function (e) {
        e.preventDefault();
        $.spinner().start();
        formHelpers.clearPreviousErrors('#sharewishlistform');
        var form = $('form.sendtofriend');
        var endPointUrl = form.attr('action') + '&previewClick=true';
        $.ajax({
            url: endPointUrl,
            type: 'post',
            dataType: 'json',
            data: form.serialize(),
            success: function (data) {
                if (!data.error && !data.serverError) {
                    $('.modal-title-sendtofriend').hide();
                    $('.modal-title-review').show();
                    $('.review-headline').show();
                    $('.server-error').hide();
                    $('.firstPart').hide();
                    $('.other').hide();
                    $('.message-sent').hide();
                    $('.send-to-friend-product').show();
                    $('#sendtofriend-preview').show();
                    $.spinner().stop();
                    formPreview(form);
                } else if (data.error) {
                    formHelpers.loadFormErrors('.sendtofriend', data.fields);
                }
                $.spinner().stop();
            },
            error: function () {
            }
        });
    });
}

/**
 * Edit the SendToFriend form.
 */
function edit() {
    $('body').on('click', '#sendtofriendformedit', function (evt) {
        evt.preventDefault();
        $.spinner().start();
        $('.modal-title-sendtofriend').show();
        $('.modal-title-review').hide();
        $('.review-headline').hide();
        $('.modal-title-sendtofriend').show();
        $('.server-error').hide();
        $('.firstPart').show();
        $('.send-to-friend-product').show();
        $('.other').show();
        $('.message-sent').hide();
        $('#sendtofriend-preview').hide();
        $.spinner().stop();
    });
}

/**
 * To clear the form content.
 */
function clearForm() {
    $('body').on('click', '#sendtofriendformcancel, .close', function (e) {
        formHelpers.clearPreviousErrors('#sharewishlistform');
    });
}

$(document).ready(function () {
    clearForm();

    share();

    edit();

    preview();

    send();

    $('#sharewishlistform').on('hidden.bs.modal', function (evt) {
        $(this).find('.modal-content').empty();
    });
});
