'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');
var PageRenderHelper = require('*/cartridge/experience/utilities/PageRenderHelper.js');
var recommendionType = 'einstein-category-recommendations';

/**
 * Render logic for the assets.einsteinproductrecommendation.
 * 
 * @param {dw.experience.PageScriptContext} context The page script context object.
 * @returns {string} The Template text.
 */
module.exports.render = function (context) {
    var model = new HashMap();
    var content = context.content;

    var category = content.category;
    var recommender = content.recommender;
    model.limit = parseInt(content.count) || 0;
    model.carouselTitle = content.carouselTitle;
    model.isCarouselTitleLeftAligned = content.isCarouselTitleLeftAligned;
    model.carouselJsonSettings = content.carouselJsonSettings;
    model.recommendionType = recommendionType;

    if (category) {
        model.categoryId = category.ID;
    }

    if (recommender) {
        model.recommender = recommender.value;
    } else {
        throw new Error('No recommender available');
    }
    model.productLoadUrl = dw.web.URLUtils.abs('AsyncComponents-Load');

    model.id = 'carousel-' + PageRenderHelper.safeCSSClass(context.component.getID());
    return new Template('experience/components/einstein/recommendationCarousel').render(model).text;
};

