'use strict';

$(document).ready(function () {
    var eswFooterUrl = $('.esw-country-selector-footer').data('url');
    $.ajax({
        url: eswFooterUrl,
        method: 'get',

        success: function (response) {
            if (response) {
                $('.esw-country-selector-footer').append(response);
            }
        }
    });
});

$('.esw-country-selector-footer').hover(

    function () {
        $('.esw-country-selector').addClass('show');
        $('.dropdown-country-selector').addClass('show');
    },

    function () {
        $('.esw-country-selector').removeClass('show');
        $('.dropdown-country-selector').removeClass('show');
    }
);