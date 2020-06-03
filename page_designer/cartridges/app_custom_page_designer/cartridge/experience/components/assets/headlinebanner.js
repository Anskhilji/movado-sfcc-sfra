'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');
var ImageTransformation = require('*/cartridge/experience/utilities/ImageTransformation.js');

/**
 * Render logic for the assets.headlinebanner.
 * 
 * @param {dw.experience.PageScriptContext} context The page script context object.
 * @returns {string} The Template text.
 */
module.exports.render = function (context) {
    var model = new HashMap();
    var content = context.content;

    model.backgroundLink = content.backgroundLink;
    model.bannerHeading = content.bannerHeading;
    model.bannerSubheading = content.bannerSubheading;
    model.bannerButton = content.bannerButton;
    model.bannerButtonText = content.bannerButtonText;
    model.buttonStyle = content.buttonStyle;
    model.headingStyle = content.headingStyle;
    model.subheadingStyle = content.subheadingStyle;
    model.isLink = content.isLink;
    model.alignment = content.alignment;

    model.image = {
        src: {
            mobile  : ImageTransformation.url(content.mobileImage, { device: 'mobile' }),
            desktop : ImageTransformation.url(content.desktopImage, { device: 'desktop' })
        },
        alt: content.desktopImage.file.getAlt()
    };

    return new Template('experience/components/assets/headlinebanner').render(model).text;
};
