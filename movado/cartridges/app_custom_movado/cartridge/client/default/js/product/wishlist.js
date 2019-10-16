'use strict';


/**
 * appends params to a url
 * @param {string} data - data returned from the server's ajax call
 * @param {Object} button - button that was clicked to add a product to the wishlist
 */
function displayMessage(data, button) {
    $.spinner().stop();
    var status;
    if (data.success) {
        status = 'alert-success';
    } else {
        status = 'alert-danger';
    }

    if ($('.add-to-wishlist-messages').length === 0) {
        $('body').append(
        '<div class="add-to-wishlist-messages "></div>'
        );
    }
    $('.add-to-wishlist-messages')
        .append('<div class="add-to-wishlist-alert text-center ' + status + '">' + data.msg + '</div>');

    setTimeout(function () {
        $('.add-to-wishlist-messages').remove();
        button.removeAttr('disabled');
    }, 5000);
}

module.exports = {
    addToWishlist: function () {
        $('.add-to-wish-list').on('click', function (e) {
            e.preventDefault();
            var options = [];
            var msgObj = {};
            var url = $(this).data('href');
            var button = $(this);

            $('.product-option').each(function (index, item) {
                var $checkedRadio = $(this).find('[type="radio"]:checked') || null;
                var checkedOptionValue = $checkedRadio.data('value-id') || null;
                var checkedOptionID = $(item).closest('.product-option').data('option-id') || null;
                var optionMessage = $(item).find('.option-message .form-control').val() || null;
                if (optionMessage) {
                    msgObj = {
                        optionId: checkedOptionID,
                        optionVal: checkedOptionValue,
                        optionMessage: optionMessage
                    };
                    options.push(msgObj);
                }
            });

            var pid = $(this).closest('.product-detail').find('.product-id').html();
            if (!url || !pid) {
                return;
            }

            $.spinner().start();
            $(this).attr('disabled', true);
            $.ajax({
                url: url,
                type: 'post',
                dataType: 'json',
                data: {
                    pid: pid,
                    options: JSON.stringify(options)
                },
                success: function (data) {
                    displayMessage(data, button);
                    button.addClass('added');
                    $('body').trigger('addWishlist:success', button);
                },
                error: function (err) {
                    displayMessage(err, button);
                    button.removeClass('added');
                }
            });
        });
    }
};
