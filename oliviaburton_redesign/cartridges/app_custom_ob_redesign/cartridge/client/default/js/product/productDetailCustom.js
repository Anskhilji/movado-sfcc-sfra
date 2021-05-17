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
        $('.primary-images .main-mvmt-carousel').slick({
            slidesToShow: 1,
            slidesToScroll: 1,
            dots: true,
            arrows:true,
            focusOnSelect: true,
            fade: true,
            customPaging: function (slick, index) {
                var thumb = $(slick.$slides[index]).find('.carousel-tile').attr('data-thumb');
                return '<button class="tab"> <img  src="'+ thumb +'" /> </button>';
            },
        });

        $( "img" ).dblclick(function() {
            $(".js-zoom-image").trigger( "click" );
          });
    },
}
