'use strict';

var processInclude = require('base/util');

$(document).ready(function () {
    processInclude(require('./product/quickView'));
});

if ($(window).width() > 768) {
    $(document).ready(function() {
        $(window).resize(function() {
        var productTitle = $(".homepagetile-wrapper-box").height() - 10;
            $('.main-container-inner img').css({'height': productTitle});
        }).resize();
    });
}