'use strict';

var eswCountrySelector = $('.esw-country-selector');
var dropdownCountrySelector = $('.dropdown-country-selector');
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
        eswCountrySelector.addClass('show');
        dropdownCountrySelector.addClass('show');
    },

    function () {
        eswCountrySelector.removeClass('show');
        dropdownCountrySelector.removeClass('show');
    }
);