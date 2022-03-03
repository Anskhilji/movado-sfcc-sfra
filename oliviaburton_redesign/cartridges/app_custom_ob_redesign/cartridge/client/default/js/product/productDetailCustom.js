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
        var moretext = "show more";
        var lesstext = "show less";

        $('.short-description p').each(function() {
            var content = $(this).html();

            if(content.length > showChar) {

                var c = content.substr(0, showChar);
                var h = content.substr(showChar, content.length - showChar);

                var html = c + '<span style="display:none" class="morecontent"><span>' + h + '</span></span><a href="" class="morelink">' + moretext + '</a>';

                $(this).html(html);
            }
        });

        $(".morelink").on('click',function(){
            if($(this).hasClass("less")) {
                $(this).removeClass("less");
                $(this).html(moretext);
                $('.morecontent').css('display','none');

            } else {
                $(this).addClass("less");
                $(this).html(lesstext);
                $('.morecontent').removeAttr("style");
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
                    breakpoint: 991,
                    settings: {
                        focusOnSelect: false,
                        slidesToShow: 2,
                        slidesToScroll: 1,
                    }
                },
            ]
        });
    }
    // Custom End
}
