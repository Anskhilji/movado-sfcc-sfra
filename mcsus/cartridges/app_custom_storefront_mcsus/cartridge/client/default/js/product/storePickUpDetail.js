'use strict';

if (window.Resources.PICKUP_FROM_STORE) {
    setTimeout(function () {
        $('.googlepay-btn').addClass('d-none');
        $('.apple-pay-pdp').addClass('d-none');
    }, 300);
} else {
    setTimeout(function () {
        $('.googlepay-btn').removeClass('d-none');
        $('.apple-pay-pdp').removeClass('d-none');
    }, 300);
} 