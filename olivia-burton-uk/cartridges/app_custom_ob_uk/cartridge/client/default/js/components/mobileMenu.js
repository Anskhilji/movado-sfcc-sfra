'use strict';

module.exports = function () {
    $('.multilevel-dropdown, .footer-redesign').on('click', '.esw-country-selector', function (e) {
        e.preventDefault();
        e.stopPropagation();

        var $eswMobileDropdown = $(this).find('.ob-mobile-esw-dropdown');
        $('.esw-country-selector .ob-mobile-esw-dropdown').not($eswMobileDropdown).hide();

        $eswMobileDropdown.toggle();
    });

    $('.multilevel-dropdown, .footer-redesign').on('click', function () {
        $('.ob-mobile-esw-dropdown').hide();
    });

};
