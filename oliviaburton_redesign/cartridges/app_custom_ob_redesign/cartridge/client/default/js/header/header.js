$('.desktop-view .feature-dropdown').hover(
    function() {
        $('.slick-slider').slick('refresh');
        var $imagesLength = $(this).find('.featured-promotion a img').length;

        if ($imagesLength > 4) {

            $('.shop-by-collection-slide .featured-promotion').slick({
                speed: 300,
                autoplay: true,
                slidesToShow: 5,
                slidesToScroll: 1,
                dots: true,
                arrows: false,
                variableWidth: true,
                infinite: true,

                responsive: [
                    {
                        breakpoint: 3000,
                        settings: {
                            slidesToShow: 7,
                        }
                    },
                    {
                        breakpoint: 1440,
                        settings: {
                            slidesToShow: 5,
                        }
                    },

                    {
                        breakpoint: 1280,
                        settings: {
                            slidesToShow: 4,
                        }
                    },
                ]
            });
        }
    },

    function() {
        var $imagesLength = $(this).find('.featured-promotion a img').length;
        if ($imagesLength > 4) {
            $('.shop-by-collection-slide .featured-promotion').slick('unslick');
        }
    },
);

$(window).on('resize', function () {
    var $leftMargin = $('.desktop-view .navbar-nav').position().left;
    $('.desktop-view .categories-dropdown').css('padding-left', $leftMargin + 'px');
}).resize();

$('.redesign-header .desktop-view .sub-ob-dropdown').mouseenter( function () {
    $('.modal-background').addClass('show-overlay');
    $('.header-banner').addClass('ob-redesign-header-banner');
});

$('.redesign-header .desktop-view .sub-ob-dropdown').mouseleave( function () {
    $('.modal-background').removeClass('show-overlay');
    $('.header-banner').removeClass('ob-redesign-header-banner');
});
