'use strict';

var movadoCollapsibleItem = require('movado/components/collapsibleItem');

module.exports = function () {
    movadoCollapsibleItem();
    var sizes = ['xs', 'sm', 'md', 'lg', 'xl'];

    sizes.forEach(function (size) {
        var selector = '.collapsible-' + size + ' .title, .collapsible-' + size + '>.card-header';
        $('body, .mini-cart-data').off('body, .mini-cart-data').on('click', selector, function (e) {
            e.preventDefault();
            var $this = $(this);
            $this.parents('.collapsible-' + size).toggleClass('active');
            $this.attr('aria-expanded', function (i, attr) {
                return attr === 'true' ? 'false' : 'true';
            });
        });
    });
};
