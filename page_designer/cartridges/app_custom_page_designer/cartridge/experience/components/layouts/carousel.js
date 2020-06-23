'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');
var PageRenderHelper = require('*/cartridge/experience/utilities/PageRenderHelper.js');

/**
 * Render logic for the layouts.carousel.
 * 
 * @param {dw.experience.PageScriptContext} context The page script context object.
 * @returns {string} The Template text.
 */
module.exports.render = function (context) {
    var model = new HashMap();
    var component = context.component;
    var content = context.content;

    // Carousel Configurations 
    model.carouselTitle = content.carouselTitle;
    model.isCarouselTitleLeftAligned = content.isCarouselTitleLeftAligned;
    model.carouselJsonSettings = content.carouselJsonSettings;
    
    // automatically register configured regions
    model.regions = PageRenderHelper.getRegionModelRegistry(component);

    // Region Configs
    var carouselRegion = model.regions.slides;
    carouselRegion.setClassName("cs-carousel carousel-component");
    model.carouselRegion = carouselRegion;
    model.id = 'carousel-' + PageRenderHelper.safeCSSClass(context.component.getID());
    model.additionalCss = content.additionalCss;
    model.idSelector = '#' + model.id;
    model.mobileMargin = content.mobileMargin;
    model.deskTopMargin = content.deskTopMargin;

    return new Template('experience/components/layouts/carousel').render(model).text;
};
