'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');
var PageRenderHelper = require('*/cartridge/experience/utilities/PageRenderHelper.js');

/**
 * Render logic for the assets.ctaButton.
 * 
 * @param {dw.experience.PageScriptContext} context The page script context object.
 * @returns {string} The Template text.
 */
module.exports.render = function (context) {
    var model = new HashMap();
    var content = context.content;

    model.backgroundColor = content.backgroundColor;
    model.textColor = content.textColor;
    model.hoverBackgroundColor = content.hoverBackgroundColor;
    model.hoverTextColor = content.hoverTextColor;
    model.ctaButtonHeight = content.ctaButtonHeight;
    model.ctaButtonWidth = content.ctaButtonWidth;
    model.ctaButtonMaxWidth = content.ctaButtonMaxWidth;
    model.ctaButtonMargin = content.ctaButtonMargin;
    model.ctaButtonPadding = content.ctaButtonPadding;
    model.ctaButtonAlignment = content.ctaButtonAlignment;

    model.ctaButtonHeightMobile = content.ctaButtonHeightMobile;
    model.ctaButtonWidthMobile = content.ctaButtonWidthMobile;
    model.ctaButtonMaxWidthMobile = content.ctaButtonMaxWidthMobile;
    model.ctaButtonMarginMobile = content.ctaButtonMarginMobile;
    model.ctaButtonPaddingMobile = content.ctaButtonPaddingMobile;
    model.ctaButtonAlignmentMobile = content.ctaButtonAlignmentMobile;

    model.buttonLink = content.buttonLink;
    model.buttonText = content.buttonText;

    model.id = 'ctaButton-' + PageRenderHelper.safeCSSClass(context.component.getID());
    model.idSelector = '#' + model.id;
    return new Template('experience/components/assets/ctaButton').render(model).text;
};
