var processInclude = require('base/util');

$(document).ready(function () {
    processInclude(require('olivia-burton-uk/main'));
    var $imagesLength = $(this).find('.desktop-view .featured-promotion a img').length;
 
    $('.desktop-view .feature-dropdown').hover(
        function() {
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
                            breakpoint: 4000,
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
            $('.shop-by-collection-slide .featured-promotion').slick("unslick");
        },
    )
});



