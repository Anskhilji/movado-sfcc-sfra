var screenSize = $(window).width();
var customScrollValue = $(window).scrollTop();
(function ($) {
    var $window = $(window),
        $document = $(document),
        $body = $('body');

    $.fn.pinElement = function (options) {
        $.fn.pinElement.defaults = {
            offsetTop: 0,
            stickyPlaceholder: '',
            $stickyParent: $document,
            unpin: false
        };

        // Extend default options.
        var opts = $.extend({}, $.fn.pinElement.defaults, options);

        var bannerHeight = $('.header-banner').outerHeight(true);
        var headerContainer = $('.header-container').outerHeight(true);
        var $headerHeight = bannerHeight + headerContainer;
        var mediumScreenSize = 992;
        var $lowerHeaderBanner = $('.lower-header-banner');

        var _setElementPosition = function ($thisInstance) {
            var prevOffset = $thisInstance.prev(opts.stickyPlaceholder).length ? $thisInstance.prev(opts.stickyPlaceholder).offset().top : 0;
            var top = parseInt(prevOffset - opts.offsetTop),
            scroll = parseInt(opts.$stickyParent.scrollTop());
            var $accessibleLink = $('.accessible-link')
            if (scroll > 0 && parseInt(opts.$stickyParent.scrollTop()) >= top) {
                $thisInstance.addClass('sticky-header').css({
                    top: 0 + (opts.offsetTop || 0)
                });
                
                // CUSTOM START: added custom class
                $('.desktop-side-search,.mobile-side-search').addClass('search-bar-header-padding');
                $('.custom-clp-social').addClass('sticky');
                $('.mini-cart-data .popover').addClass('afterSticky');
                $thisInstance.parent().addClass('fixed-header');
                $accessibleLink.addClass('d-none');
                if (typeof $lowerHeaderBanner !== 'undefined'  && ($lowerHeaderBanner !== '' || $lowerHeaderBanner.length > 0)) {
                    $lowerHeaderBanner.addClass('lower-header-banner-tuck');
                }
            } else {
                $thisInstance.removeClass('sticky-header');
                // CUSTOM START: removed custom class                
                if (screenSize != null) {
                    if (screenSize <= mediumScreenSize) {
                        setTimeout(function(){  
                            var $customTop = $headerHeight - customScrollValue - 5;
                            $('.mini-cart-data .popover').css({'top': $customTop +'px', 'height': 'calc(100% - '+ $customTop +'px)'});
                         }, 100);
                       
                    } else {
                        $('.mini-cart-data .popover').css({'top':'0', 'height': '100%'});
                    }
                }
                $('.desktop-side-search,.mobile-side-search').removeClass('search-bar-header-padding');
                $('.custom-clp-social').removeClass('sticky');
                $('.mini-cart-data .popover').removeClass('afterSticky');
                $thisInstance.parent().removeClass('fixed-header');
                $accessibleLink.removeClass('d-none');
                if (typeof $lowerHeaderBanner !== 'undefined'  && ($lowerHeaderBanner !== '' || $lowerHeaderBanner.length > 0)) {
                    $lowerHeaderBanner.removeClass('lower-header-banner-tuck');
                }
            }
        };

        // pinElement the collection based on the settings variable.
        return this.each(function () {
            var $thisInstance = $(this);
         // CUSTOM START: removed custom class
            $body.find('.sticky-header,.fixed-header').removeClass('sticky-header fixed-header');
            $body.find('.desktop-side-search,.mobile-side-search').removeClass('search-bar-header-padding');
            

            // Unpin Element when unpin is set true
            if (opts.unpin) {
                $window.off('scroll.pinElement');
                return;
            }

            // Stick on page load
            _setElementPosition($thisInstance);

            // Stick on scroll
            $window.off('scroll.pinElement').on('scroll.pinElement', $thisInstance, function () {
                _setElementPosition($thisInstance);
            });
        });
    };
}(jQuery));

$('.header-menu-wrapper').pinElement();

$(window).on('resize', function (e) {
    screenSize = $(window).width();  
})

$(window).on('scroll', function() {
    customScrollValue = $(this).scrollTop();
});

