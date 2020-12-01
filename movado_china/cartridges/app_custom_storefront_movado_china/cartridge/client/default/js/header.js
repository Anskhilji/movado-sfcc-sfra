'use strict';

$(document).ready(function() {
    if ($(".minicart").is(":visible")) {
        $('header.new-header .user .popover').css('left', '-3rem');
    } else {
        $('header.new-header .user .popover').css('left', '-5rem');
    }
});