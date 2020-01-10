'use strict';

$('.quantity-form > .quantity').on('keypress keyup', function (event) {
    $(this).val($(this).val().replace(/[^\d].+/, ''));

    if ((event.which < 48 || event.which > 57)) {
        event.preventDefault();
    }
    if (event.keyCode != 8 && event.keyCode != 46) {
        $(this).trigger('change');
        var quantity = parseInt($(this).val());

        if (quantity == 0) {
            quantity = 1;
            $(this).val(quantity);
        }

        if (quantity == 1 || quantity == 0) {
            $('#decreased-btn').attr('disabled', true);
        } else {
            $('#decreased-btn').attr('disabled', false);
        }
    }
});

$('#decreased-btn').click(function (e) {
    var quantity = parseInt($('.quantity-form > .quantity').val());

    if (isNaN(quantity)) {
        $('#decreased-btn').attr('disabled', true);
        quantity = 1;
    }

    quantity = (quantity > 1) ? quantity - 1 : quantity;

    if (quantity == 1) {
        $('#decreased-btn').attr('disabled', true);
    } else {
        $('#decreased-btn').attr('disabled', false);
    }
    $('.quantity-form > .quantity').val(quantity);
    $('.quantity-form > .quantity').trigger('change');
});

$('#increased-btn').click(function (e) {
    var quantity = parseInt($('.quantity-form > .quantity').val());

    if (isNaN(quantity)) {
        $('.quantity-form > .quantity').val(1);
        $('#decreased-btn').attr('disabled', true);
    }

    if (quantity >= 1) {
        $('#decreased-btn').attr('disabled', false);
        quantity = quantity + 1;
        $('.quantity-form > .quantity').val(quantity);
    }
    $('.quantity-form > .quantity').trigger('change');
});
