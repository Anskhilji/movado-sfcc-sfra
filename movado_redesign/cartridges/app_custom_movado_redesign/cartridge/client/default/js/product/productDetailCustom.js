'use strict';
$('.carousel-nav').slick({
	slidesToShow: 5,
	slidesToScroll: 1,
	asNavFor: '.primary-images .main-carousel',
	dots: false,
	centerMode: true,
	focusOnSelect: true,
});

$(function() {
    //----- OPEN
    $('.pdp-v-one [pd-popup-open]').on('click', function(e)  {
        var targeted_popup_class = jQuery(this).attr('pd-popup-open');
        $('[pd-popup="' + targeted_popup_class + '"]').fadeIn(100);
        $(".prices-add-to-cart-actions").css("z-index", "999999");
        e.preventDefault();
    });
 
    //----- CLOSE
    $('.pdp-v-one [pd-popup-close]').on('click', function(e)  {
        var targeted_popup_class = jQuery(this).attr('pd-popup-close');
        $('[pd-popup="' + targeted_popup_class + '"]').fadeOut(200);
        $(".prices-add-to-cart-actions").css("z-index", "9");
        e.preventDefault();
    });
    $('.pdp-v-one .popup-action-btns .save').on('click', function()  {
        var textaraetext=$('.pdp-v-one .text-area textarea.valid').val();
        $('.pdp-v-one .engravedtext').text(textaraetext);
    });
    save
});