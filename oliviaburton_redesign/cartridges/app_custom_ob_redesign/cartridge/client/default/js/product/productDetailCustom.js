'use strict';

const { load } = require("cheerio");

module.exports = {
    

    personlizePopup: function () {
        $('.product-detail-redesign [pd-popup-open]').on('click', function(e) {
            e.stopPropagation();
            var targeted_popup_class = $(this).attr('pd-popup-open');
            $('[pd-popup="' + targeted_popup_class + '"]').fadeIn(100).addClass('popup-opened');
            $('.prices-add-to-cart-actions').addClass('extra-z-index');
            $('body, html').addClass('no-overflow');
            e.preventDefault();
        });  

        $(document).on('click', 'form[name="embossing"] button', function (e) {
            $(this).removeClass('submitted');
        });

        $('.pdp-v-one .debossing-form .popup-action-btns .save').on('click', function() {
            $('.debossing-btn edit-popup').addClass('show-deboss-text');
            var embossingForm = $('.pdp-v-one').find('form[name="embossing"]');
            var engravedButton = $('.save');
            if (engravedButton.hasClass('submitted')) {
                $(this).removeClass('submitted');
                $('.debossing-btn').removeClass('submitted');
                $('.debossing-form').removeClass('submitted');
            }

            setTimeout(function() {
                var debossingtext=$.trim($('.pdp-v-one .debossing-form .text-area .debossing-input.valid').val());
                var debossingtextEdit=$.trim($('.pdp-v-one .debossing-form .text-area .debossing-input').val());
                var debossingtextVertical=$.trim($('.pdp-v-one .debossing-form .text-area .debossing-value').val());
                if((debossingtext == undefined || debossingtext == "") && (debossingtextEdit == undefined || debossingtextEdit == "") && (debossingtextVertical == undefined || debossingtextVertical == "") ) {
                    $('.pdp-v-one .debossing-text').text("");
                } else {
                    $('.debossing-btn').addClass('submitted'); 
                    if (debossingtext !=='' && debossingtext !==undefined) {
                        $('.pdp-v-one .debossing-text').text(debossingtext);
                    }
                    if (debossingtextEdit !=='' && debossingtextEdit !==undefined) {
                        $('.pdp-v-one .debossing-text').text(debossingtextEdit);
                    }
                    if (debossingtextVertical !=='' && debossingtextVertical !==undefined) {
                        $('.pdp-v-one .debossing-text').text(debossingtextVertical);
                    }
                    $('.debossing-cancel').attr('form', 'embossingForm');
                    $('.debossing-cancel').attr('type', 'submit');
                    $('.option-message input').attr("readonly", false);
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
            $('#standard-text').focusout();
            $('#horizontal-text').focusout();
            $('#vertical-text').focusout();
            e.preventDefault();
        });

        $('.pdp-v-one .dont-add').on('click', function(e) { 
            $('.debossing-btn').removeClass('submitted');
        });

        $('.pdp-v-one .debossing-cancel').on('click', function(e) {
            if ($('.pdp-v-one .debossing-text').text() === '') {
                e.stopPropagation();
                $('.pdp-v-one .debossing-input').val('');
                $(".prices-add-to-cart-actions").removeClass('extra-z-index');
                $('body, html').removeClass('no-overflow');
                $('body').removeClass('no-scroll');
                $('.popup-opened').hide();
                e.preventDefault();
                return;
            } else {
                $('.debossing-cancel').removeClass('submitted');
                $('.debossing-cancel').removeAttr('form');
                $('.debossing-cancel').removeAttr('type');
            }
    
            $('.pdp-v-one .debossing-text').text('');
            $('.pdp-v-one .debossing-form .text-on-watch span').text('');
            $('.pdp-v-one .debossing-input').val('');
            var targeted_popup_class = jQuery(this).attr('pd-popup-close');
            $('[pd-popup="' + targeted_popup_class + '"]').fadeOut(200).removeClass('popup-opened');
            $('body, html').removeClass('no-overflow');
            $('body').removeClass('no-scroll');
            $('.popup-opened').hide();
        });

        $('.pdp-v-one .popup-tabs .debossing-tabs').on('click', function(e) {
            var $popuptab = $(this).data('id');
            if ($popuptab !==undefined && $popuptab !=='') {
                if ($popuptab == 'horizontal-text') {
                    $('.pdp-v-one .popup-body .orientation-switch .orientation-horizontal').attr('checked',true);
                    $('.pdp-v-one .popup-body .orientation-switch .orientation-vertical').attr('checked',false)
                }
                if ($popuptab == 'vertical-text') {
                    $('.pdp-v-one .popup-body .orientation-switch .orientation-vertical').attr('checked',true);
                    $('.pdp-v-one .popup-body .orientation-switch .orientation-horizontal').attr('checked',false);
                }
            }
        });
    },
    
    primarySlider: function () {

        
        $('.primary-images .main-ob-carousel').slick({
            lazyLoad: 'ondemand',
            slidesToShow: 1,
            slidesToScroll: 1,
            dots: true,
            arrows:true,
            customPaging: function (slick, index) {
                var thumb = $(slick.$slides[index]).find('.carousel-tile').attr('data-thumb');
                return '<button class="tab"> <img  src="'+ thumb +'" /> </button>';
            },
        });

        $(document).on('beforeChange', '.primary-images .main-ob-carousel', function (event, slick, currentSlide, nextSlide) {
            var nextSlide = slick.$slides.get(nextSlide);
            var $slideSourceSets = $(nextSlide).find('source');
            $($slideSourceSets).each(function () {
                $(this).attr('srcset', $(this).data('lazy'));
            });
        });

    },

    // Custom Start: [MSS-1341 To Show/Hide More Short Description on PDP]
    showMoreDescription: function () {
        var showChar = 176;  // Characters that are shown by default
        var moretext = ' show more';
        var lesstext = ' show less';
        $('.short-description p').each(function() {
            var content = $(this).html();
            if(content.length > showChar) {
                var c = content.substr(0, showChar);
                var h = content.substr(showChar, content.length - showChar);
                var html = c + '<span style="display:none" class="morecontent-wrapper"><span>' + h + '</span></span><a href="" class="morelink-wrapper" style="text-decoration: underline; display: inline-block">' + moretext + '</a>';
                $(this).html(html);
            }
        });
        $('.morelink-wrapper').on('click',function(){
            if($(this).hasClass('less')) {
                $(this).removeClass('less');
                $(this).html(moretext);
                $('.morelink-wrapper').css('margin-left','4px');
                $('.morecontent-wrapper').css('display','none');
            } else {
                $(this).addClass('less');
                $(this).html(lesstext);
                $('.morelink-wrapper').css('margin-left','4px');
                $('.morecontent-wrapper').css('display','inline');
            }
            return false;
        });
    },
    showMoredetailOb: function () {
        var showChar = 264;  // Characters that are shown by default
        var moretext = ' show more';
        var lesstext = ' show less';
        $('.setitem-description .content').each(function() {
            var content = $(this).html();
            if(content.length > showChar) {
                var c = content.substr(0, showChar);
                var h = content.substr(showChar, content.length - showChar);
                var html = c + '<span style="display:none" class="morecontent-wrapper"><span>' + h + '</span></span><a href="" class="morelink-wrapper" style="text-decoration: underline; display: inline-block; margin-left: 4px;">' + moretext + '</a>';
                $(this).html(html);
            }
        });
        $('.morelink-wrapper').on('click',function() {
            if($(this).hasClass('less')) {
                $(this).removeClass('less');
                $(this).html(moretext);
                $('.morelink-wrapper').css('margin-left','4px');
                $('.morecontent-wrapper').css('display','none');
            } else {
                $(this).addClass('less');
                $(this).html(lesstext);
                $('.morelink-wrapper').css('margin-left','4px');
                $('.morecontent-wrapper').css('display','inline');
            }
            return false;
        });
    },
    showMoreBottomDescription: function () {
        var showChar = 176;  // Characters that are shown by default
        var moretext = ' show more';
        var lesstext = ' show less';
        $('.bottom-description p').each(function() {
            var content = $(this).html();
            if(content.length > showChar) {
                var c = content.substr(0, showChar);
                var h = content.substr(showChar, content.length - showChar);
                var html = c + '<span style="display:none" class="morecontent"><span>' + h + '</span></span><a href="" class="morelink" style="text-decoration: underline; display: inline-block">' + moretext + '</a>';
                $(this).html(html);
            }
        });
        $('.morelink').on('click',function() {
            if($(this).hasClass('less')) {
                $(this).removeClass('less');
                $(this).html(moretext);
                $('.morelink').css('margin-left','4px');
                $('.morecontent').css('display','none');
            } else {
                $(this).addClass('less');
                $(this).html(lesstext);
                $('.morelink').css('margin-left','4px');
                $('.morecontent').css('display','inline');
            }
            return false;
        });
    },

    linkedSlider: function () {
        $('.recomended-products-redesign').slick({
            slidesToShow: 3,
            slidesToScroll: 1,
            focusOnSelect: true,
            infinite: false,
            dots: false,
            arrows: true,
            responsive: [
                {
                    breakpoint: 1200,
                    settings: {
                        focusOnSelect: false,
                        slidesToShow: 2,
                        slidesToScroll: 1,
                    }
                },
            ]
        });
    },
    loadCartButtonOnScroll: function () {
        if ($(window).width() < 544) {
            $(window).scroll(function (event) {
                var $description = $('.scroll-sticky');
                if ($description.length > 0) {
                    var $elementOffset = $description.offset().top - 30,
                    $elementOuter = $description.outerHeight(),
                    $windowHeight = $(window).height(),
                    $thisScroll = $(this).scrollTop();
                    if ($thisScroll > ($elementOffset+$elementOuter-$windowHeight)){
                        $('.cart-sticky-wrapper-btn').addClass('d-block');
                    } else {
                        $('.cart-sticky-wrapper-btn').removeClass('d-block');
                    }
                }
            });
        }
    },
    loadCartButton: function () {
        if ($(window).width() < 544) {
            $(window).scroll(function (event) {
                var $description = $('.scroll-wrapper-inner');
                if ($description.length > 0) {
                    var $elementOffset = $description.offset().top - 10,
                    $elementOuter = $description.outerHeight(),
                    $windowHeight = $(window).height(),
                    $thisScroll = $(this).scrollTop();
                    if ($thisScroll > ($elementOffset+$elementOuter-$windowHeight)){
                        $('.cart-sticky-wrapper-btn').addClass('d-none');
                    } else {
                        $('.cart-sticky-wrapper-btn').removeClass('d-none');
                    }
                }
            });
        }
    }
    // Custom End
}


