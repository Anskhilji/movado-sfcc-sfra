'use strict';

module.exports = {
    showMoreText: function () {

        // Configure/customize these variables.
        var showChar = 156;  // How many characters are shown by default
        var moretext = "Show more";
        var lesstext = "Show less";

        $('.bottom-description p').each(function() {
            var content = $(this).html();

            if(content.length > showChar) {

                var c = content.substr(0, showChar);
                var h = content.substr(showChar, content.length - showChar);

                var html = c + '<span class="moreellipses"></span><span class="morecontent"><span>' + h + '</span> <a href="" class="morelink">' + moretext + '</a></span>';

                $(this).html(html);
            }
        });

        $(".morelink").on('click',function(){
            if($(this).hasClass("less")) {
                $(this).removeClass("less");
                $(this).html(moretext);
            } else {
                $(this).addClass("less");
                $(this).html(lesstext);
            }
            $(this).parent().prev().toggle();
            $(this).prev().toggle();
            return false;
        });
    },

    personlizePopup: function () {
        $('.product-detail-redesign [pd-popup-open]').on('click', function(e) {
            e.stopPropagation();
            var targeted_popup_class = $(this).attr('pd-popup-open');
            $('[pd-popup="' + targeted_popup_class + '"]').fadeIn(100).addClass('popup-opened');
            $('.prices-add-to-cart-actions').addClass('extra-z-index');
            $('body, html').addClass('no-overflow');
            e.preventDefault();
        });  

        // $('.product-detail-redesign .debossing-cancel, .product-detail-redesign .popup-close-btn').on('click', function(e) {
        //     if ($('.pdp-v-one .debossing-text').text() === '') {
        //         e.stopPropagation();
        //         $('.pdp-v-one .debossing-input').val('');
        //         $(".prices-add-to-cart-actions").removeClass('extra-z-index');
        //         $('body, html').removeClass('no-overflow');
        //         $('body').removeClass('no-scroll');
        //         $('.popup-opened').hide();
        //         e.preventDefault();
        //         return;
        //     } else {
        //         $('.debossing-cancel').removeClass('submitted');
        //         $('.debossing-cancel').removeAttr('form');
        //         $('.debossing-cancel').removeAttr('type');
        //     }
    
        //     $('.pdp-v-one .debossing-text').text('');
        //     $('.pdp-v-one .debossing-form .text-on-watch span').text('');
        //     $('.pdp-v-one .debossing-input').val('');
        //     var targeted_popup_class = jQuery(this).attr('pd-popup-close');
        //     $('[pd-popup="' + targeted_popup_class + '"]').fadeOut(200).removeClass('popup-opened');
        //     $('body, html').removeClass('no-overflow');
        //     $('body').removeClass('no-scroll');
        //     $('.popup-opened').hide();
        // });
    }
}
$(function() {
$('.pdp-v-one .debossing-form .popup-action-btns .save').on('click', function() {
    $('.debossing-btn > edit-popup').addClass('show-deboss-text');
    var a = $.trim($('.pdp-v-one .debossing-input.valid').val());
    setTimeout(function() {
        var debossingtext=$.trim($('.pdp-v-one .debossing-form .text-area .debossing-input.valid').val());
        console.log(debossingtext);
        if(debossingtext == undefined || debossingtext == "") {
            $('.pdp-v-one .debossing-text').text("");
        } else {
            $('.pdp-v-one .debossing-text').text(debossingtext);
            $('.pdp-v-one .debossing-form .text-on-watch span').text(debossingtext);
            $('.debossing-cancel').addClass('submitted');
            $('.debossing-cancel').attr('form', 'embossingForm');
            $('.debossing-cancel').attr('type', 'submit');
        }
    }, 100);
});

$('.pdp-v-one .popup-close-btn').on('click', function(e) {
    e.stopPropagation();
    var targeted_popup_class = jQuery(this).attr('pd-popup-close');
    $('[pd-popup="' + targeted_popup_class + '"]').fadeOut(200).removeClass('popup-opened');
    $(".prices-add-to-cart-actions").removeClass('extra-z-index');
    $('body, html').removeClass('no-overflow');
    $('.popup-opened').hide();
    e.preventDefault();
});

});
