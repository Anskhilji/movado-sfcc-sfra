'use strict';

function showSwatchImages() {
    var colorAttribute;
    var colorFilter;
    $('#color-swatch-images').find('img').each(function(i, img) {
        img = $(img);
        colorAttribute = $('.color-attribute').find('.' + img.attr('id'));
        
        colorAttribute.css('background', 'url(' + img.attr('src') + ') center no-repeat');
        colorAttribute.css('background-size', '2.5em');
        colorAttribute.css('height', '2.5em');
        colorAttribute.css('width', '2.5em');
        colorAttribute.css('display', 'inline-block');
        
        colorFilter = $('.filter-bar').find('.swatch-filter.' + img.attr('id'));
        colorFilter.css('background', 'url(' + img.attr('src') + ') center no-repeat');
        colorFilter.css('background-size', '1.38em');
        colorFilter.css('height', '1.38em');
        colorFilter.css('width', '1.38em');
    });
}

module.exports = {
    showSwatchImages: showSwatchImages
};
