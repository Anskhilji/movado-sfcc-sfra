'use strict';

var eswFooterSelector = $('.esw-country-selector-footer');

$(document).ready(function () {
    var eswFooterUrl = eswFooterSelector.data('url');
    $.ajax({
        url: eswFooterUrl,
        method: 'get',

        success: function (response) {
            if (response) {
                eswFooterSelector.append(response);
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