'use strict';

var profanityFilter = require('./profanityFilter');

$('.pdp-v-one [pd-popup-open]').on('click', function (e) {
    var $engravingInputOne = $('.engraving-input-one').val();

    if ($engravingInputOne.length > 0) {
        $('.engraving-input').next().removeClass('d-none');
    } else {
        $('.engraving-input').next().addClass('d-none');
    }

    var $targeted_popup_class = $(this).attr('pd-popup-open');
    $('[pd-popup="' + $targeted_popup_class + '"]').fadeIn(100).addClass('popup-opened');
    $('.prices-add-to-cart-actions').addClass('extra-z-index');
    $('.prices-add-to-cart-actions.cart-sticky-wrapper-btn').removeClass('extra-z-index');
    $('body, html').addClass('no-overflow');
    e.preventDefault();
    e.stopImmediatePropagation();
});

$('.pdp-v-one .pulse-engraving-cancel').on('click', function (e) {
    var $targeted_popup_class = $(this).attr('pd-popup-close');
    $('[pd-popup="' + $targeted_popup_class + '"]').fadeOut(200).removeClass('popup-opened');
    $(".prices-add-to-cart-actions").removeClass('extra-z-index');
    $('body, html').removeClass('no-overflow');
    $('body').removeClass('no-scroll');
    $('.popup-opened').hide();
});

$('.pdp-v-one .close-option-popup').on('click', function (e) {
    e.stopPropagation();
    var $targeted_popup_class = $(this).attr('pd-popup-close');
    $('[pd-popup="' + $targeted_popup_class + '"]').fadeOut(200).removeClass('popup-opened');
    $(".prices-add-to-cart-actions").removeClass('extra-z-index');
    $('body, html').removeClass('no-overflow');
    $('.popup-opened').hide();
    e.preventDefault();
});

$('.engraving-input').on('input', function () {

    if ($(this).val().length > 0) {
        $(this).next().removeClass('d-none');
    } else {
        $(this).next().addClass('d-none');
    }
});

$('.engraving-input-one').on('change', function () {
    $('.engraving-save.save').prop('disabled', true);
});

$('.engraving-input-two').on('change', function () {
    $('.engraving-save.save').prop('disabled', true);
});

$('.remove-value').click(function (e) {
    var $isEngravingInput = $(this).prev();

    if ($isEngravingInput.val().length > 0) {
        $isEngravingInput.val('');
        $(this).addClass('d-none');
        $('.engraved-text-one').text('');
        $('.engraved-text-two').text('');
        $('.engraving-save.save').prop('disabled', true);
        $('.add-engraving').removeClass('d-none');
        $('.remove-engraving').addClass('d-none');
        $('.engraving-error-msg').text('');
    }
});

$('.engraving-save.save').on('click', function (e) {
    if ($('.engraving-input-one').val().trim().length > 0) {
        var $engravingText1 = $('.engraving-input-one').val();
        var $engravingText2 = $('.engraving-input-two').val();
        var $previewUrl = $('.preview-btn').attr('preview-url');
        $('.add-engraving').addClass('d-none');
        $('.remove-engraving').removeClass('d-none');
        $('.engraved-text-one').text($engravingText1);
        $('.engraved-text-two').text($engravingText2);
        $('.engraving-input').next().addClass('d-none')
        $('.prices-add-to-cart-actions').removeClass('extra-z-index');
        $('body, html').removeClass('no-overflow');
        $('body').removeClass('no-scroll');
        $('.popup-opened').hide();
        var $url = $('.engraving-save').data('url');
        var $productId = $('.preview-btn').data('pid');
        var $form = {
            line1Text: $engravingText1,
            line2Text: $engravingText2,
            productId: $productId,
            previewUrl: $previewUrl
        }
        $.spinner().start();
        $.ajax({
            url: $url,
            method: 'POST',
            data: $form,
            success: function (response) {
                $.spinner().stop();
            },
            error: function () {
                $.spinner().stop();
            }
        });
        return;
    }
});

$(document).on('click', '.remove-engraving', function (e) {
    e.preventDefault();
    var $defaultImage = $('.default-image').data('default-image');
    var $engravingText1 = $('.engraving-input-one');
    var $engravingText2 = $('.engraving-input-two');
    var $imgPreview = $('.preview-img');
    var $removeEngraving = $('.remove-engraving');
    $engravingText1.val('');
    $engravingText2.val('');
    $('.engraved-text-one').text('');
    $('.engraved-text-two').text('');
    $('.add-engraving').removeClass('d-none');
    $removeEngraving.addClass('d-none');
    $('.engraving-save.save').prop('disabled', true);
    $imgPreview.attr('src', $defaultImage);
    $imgPreview.prev().attr('srcset', $defaultImage);
    $imgPreview.prev().prev().attr('srcset', $defaultImage);
    var $url = $removeEngraving.data('engrave-url');
    var $form = {
        line1Text: '',
        line2Text: '',
        productId: '',
        previewUrl: ''
    }
    $.spinner().start();
    $.ajax({
        url: $url,
        method: 'POST',
        data: $form,
        success: function (response) {
            $.spinner().stop();
        },
        error: function () {
            $.spinner().stop();
        }
    });
});

$(document).mouseup(function (e) {
    var $container = $(".custom-options .popup .popup-inner");
    if (!$container.is(e.target) && $container.has(e.target).length === 0) {
        $(".custom-options .popup-opened").fadeOut(200);
        var targeted_popup_class = $(this).attr('pd-popup-close');
        $('[pd-popup="' + targeted_popup_class + '"]').fadeOut(200).removeClass('popup-opened');
        $(".prices-add-to-cart-actions").removeClass('extra-z-index');
        $('body, html').removeClass('no-overflow');
        $('body').removeClass('no-scroll');
        e.preventDefault();
    }
});

$('.preview-btn').click(function (e) {
    var $clicked = e.target.closest('.preview-btn');

    if (!$clicked) return;
    if ($clicked) {
        var $EngravingoptionTextone = '';
        var $EngravingoptionTextTwo = '';
        var $engravingInputOne = $('.engraving-input-one');
        var $engravingInputTwo = $('.engraving-input-two');
        var $engravingErrorMsg = $('.engraving-error-msg');
        var $engravedTextOne = $('.engraved-text-one');
        var $engravedTextTwo = $('.engraved-text-two');
        var $engravingProfanityErrorMsg = $('.engraving-profanity-error-msg');
        var profaneTextOne;
        var profaneTextTwo;
        $engravedTextOne.text('');
        $engravedTextTwo.text('');
        $engravingErrorMsg.text('');
        $engravingProfanityErrorMsg.text('');

        if ($engravingInputOne.length > 0) {
            $EngravingoptionTextone = $engravingInputOne.val().trim();
            var $regex = /^[a-zA-Z0-9\s]*$/;
            var $isValid = $regex.test($EngravingoptionTextone);

            if ($EngravingoptionTextone == '' || $EngravingoptionTextone.length > 10 || !$isValid) {
                $engravingErrorMsg.text(window.Resources.ENGRAVING_ERROR_MESSAGE);
                $EngravingoptionTextone = '';
                $EngravingoptionTextTwo = '';
                return;
            }

            if ($engravingInputTwo.length > 0) {
                $EngravingoptionTextTwo = $engravingInputTwo.val().trim();

                var $isValidOptionalVal = $regex.test($EngravingoptionTextTwo);

                if ($EngravingoptionTextTwo.length > 10 || !$isValidOptionalVal) {
                    $engravingErrorMsg.text(window.Resources.ENGRAVING_ERROR_MESSAGE);
                    $EngravingoptionTextone = '';
                    $EngravingoptionTextTwo = '';
                    return;
                }
            }

            if ($EngravingoptionTextone || $EngravingoptionTextTwo) {
                if ($EngravingoptionTextone) {
                    profaneTextOne = profanityFilter.isProfane($EngravingoptionTextone);                    
                }

                if ($EngravingoptionTextTwo) {
                    profaneTextTwo = profanityFilter.isProfane($EngravingoptionTextTwo);
                }
            }

            if (profaneTextOne !== true && profaneTextTwo !== true) {
                if ($EngravingoptionTextone || $EngravingoptionTextTwo) {
                    var $productId = $($clicked).data('pid');
                    var $form = {
                        line1Text: $EngravingoptionTextone,
                        line2Text: $EngravingoptionTextTwo,
                        productId: $productId
                    }
                    var $url = $($clicked).data('url');
                    $.spinner().start();
                    $.ajax({
                        url: $url,
                        method: 'POST',
                        data: $form,
                        success: function (response) {
    
                            if (response && response.result && response.result.success && response.result.response) {
                                $('.engraving-save.save').prop('disabled', false);
                                $('.preview-img').attr('src', response.result.response);
                                $('.preview-btn').attr('preview-url', response.result.response);
                                $('.preview-img').prev().attr('srcset', response.result.response);
                                $('.preview-img').prev().prev().attr('srcset', response.result.response);
                            } else {
                                $engravingErrorMsg.text(response.message);
                            }
                            $.spinner().stop();
                        },
                        error: function () {
                            $.spinner().stop();
                        }
                    });
                }
            } else {
                $engravingProfanityErrorMsg.text(window.Resources.ENGRAVING_PROFANE_ERROR_MESSAGE);
            }
        }
    }
});
