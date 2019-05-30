'use strict';

var formValidation = require('base/components/formValidation');

module.exports = {
    contactus: function () {
        $('form.contactus').submit(function (e) {
            var form = $(this);
            e.preventDefault();
            var url = form.attr('action');
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
                        $('.contactus-page')
                            .empty()
                            .append(data.message);
                    }
                },
                error: function (data) {
                    form.spinner().stop();
                }
            });
            return false;
        });
    }
};
