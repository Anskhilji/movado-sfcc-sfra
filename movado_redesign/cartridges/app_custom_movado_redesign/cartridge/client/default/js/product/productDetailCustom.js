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
    $('.pdp-v-one .engraving-form .popup-action-btns .save').on('click', function()  {
        setTimeout(function(){ 
            var getText=$.trim($('.pdp-v-one .engraving-form .text-area .engraving-input.valid').val());
            var showText = getText.replace("/<br\s*\/?>/mg","\n");
            if(showText == undefined || showText == ""){
                $('.pdp-v-one .engraved-text').text("");
                $('.pdp-v-one .engraving-form .text-on-watch pre').text("Line 1\nLine2");
                
            }else {
                $('.pdp-v-one .engraved-text').text(showText);
                $('.pdp-v-one .engraving-form .text-on-watch pre').text(showText);
            }
        }, 300);
    });

    $('.pdp-v-one .debossing-form .popup-action-btns .save').on('click', function()  {
        setTimeout(function(){ 
            var debossingtext=$.trim($('.pdp-v-one .debossing-form .text-area .debossing-input.valid').val());
            if(debossingtext == undefined || debossingtext == ""){
                $('.pdp-v-one .debossing-text').text("");
                $('.pdp-v-one .debossing-form .text-on-watch span').text("Line 1");
            }else {
                $('.pdp-v-one .debossing-text').text(debossingtext);
                $('.pdp-v-one .debossing-form .text-on-watch span').text(debossingtext);
            }
        }, 300);
    });
});