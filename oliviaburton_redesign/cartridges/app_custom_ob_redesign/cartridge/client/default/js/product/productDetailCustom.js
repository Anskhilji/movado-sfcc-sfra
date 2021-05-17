'use strict';

const { load } = require("cheerio");

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

        var popoupTitle = $('.debossing-form .popup-title').text();
        $('.debossing-btn .open-popup').text(popoupTitle);

        $(document).on('click', 'form[name="embossing"] button', function (e) {
            $(this).removeClass('submitted');
        });

        $('.pdp-v-one .debossing-form .popup-action-btns .save').on('click', function() {
            $('.debossing-btn edit-popup').addClass('show-deboss-text');
            var a = $.trim($('.pdp-v-one .debossing-input.valid').val());
            setTimeout(function() {
                var debossingtext=$.trim($('.pdp-v-one .debossing-form .text-area .debossing-input').val());
                if(debossingtext == undefined || debossingtext == "") {
                    $('.pdp-v-one .debossing-text').text("");
                } else {
                    $('.debossing-btn').addClass('submitted');
                    $('.pdp-v-one .debossing-text').text(debossingtext);
                    $('.debossing-cancel').attr('form', 'embossingForm');
                    $('.debossing-cancel').attr('type', 'submit');
                    $('.option-message input').attr("readonly", false);
                    'use strict';
                    $('.popup-action-btns .save').removeClass('submitted');
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

        $('.pdp-v-one .dont-add').on('click', function(e) { 
            $('.debossing-btn').removeClass('submitted');
        });
    }
}


