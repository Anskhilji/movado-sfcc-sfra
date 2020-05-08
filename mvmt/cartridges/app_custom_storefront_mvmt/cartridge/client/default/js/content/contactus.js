'use strict';

var formValidation = require('base/components/formValidation');

module.exports = {
    contactus: function () {
        $('.contact-us-form-wrapper').off('submit', 'form.contactus').on('submit', 'form.contactus', function (e) {
            var form = $(this);
            e.preventDefault();
            var $form = $(this);
            var url = form.attr('action');
            var $messageContainer = $('.contact-tab-form-message');
            $messageContainer.hide();
            form.spinner().start();
            $.ajax({
                url: url,
                type: 'post',
                dataType: 'json',
                data: form.serialize(),
                success: function (data) {
                    form.spinner().stop();
                    if (!data.success) {
                        formValidation(form, data);
                    } else {
                        $messageContainer.show().html(data.message);
                    }
                    $form.hide();
                    $('html, body').animate({
                        scrollTop: $('.contact-tab-callout-wrapper').offset().top
                    }, 250);
                },
                error: function (data) {
                    form.spinner().stop();
                    $form.hide();
                    $('html, body').animate({
                        scrollTop: $('.contact-tab-callout-wrapper').offset().top
                    }, 250);
                    
                }
            });
            return false;
        });
    }
};
