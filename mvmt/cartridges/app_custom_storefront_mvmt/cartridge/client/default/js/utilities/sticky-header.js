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

        var _setElementPosition = function ($thisInstance) {
            var prevOffset = $thisInstance.prev(opts.stickyPlaceholder).length ? $thisInstance.prev(opts.stickyPlaceholder).offset().top : 0;
            var top = parseInt(prevOffset - opts.offsetTop),
                scroll = parseInt(opts.$stickyParent.scrollTop());
            if (scroll > 0 && parseInt(opts.$stickyParent.scrollTop()) >= top) {
                $thisInstance.addClass('sticky-header').css({
                    top: 0 + (opts.offsetTop || 0)
                });
                // CUSTOM START: added custom class
                $('.desktop-side-search,.mobile-side-search').addClass('search-bar-header-padding');
                $thisInstance.parent().addClass('fixed-header');
            } else {
                $thisInstance.removeClass('sticky-header');
             // CUSTOM START: removed custom class
                $('.desktop-side-search,.mobile-side-search').removeClass('search-bar-header-padding');
                $thisInstance.parent().removeClass('fixed-header');
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
