'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');
var featuredPost = 'Featured';
var disruptedPost = 'Disrupted';

/**
 * Render logic for the assets.featuredPostTile.
 * 
 * @param {dw.experience.PageScriptContext} context The page script context object.
 * @returns {string} The Template text.
 */
module.exports.render = function (context) {
    var model = new HashMap();
    var content = context.content;
    model.title = content.title;
    model.link = content.link;
    model.subheading = content.subheading;
    model.excerpt = content.excerpt;
    var attr = context.getComponentRenderSettings().getAttributes() || new HashMap();
    attr.put('class', 'post-container');
    context.getComponentRenderSettings().setAttributes(attr);
    
    // Post Buttons
    var buttons = new Array();
    if (!empty(content.primaryButtonText) && !empty(content.primaryButtonLink)) {
        buttons.push({
            link: content.primaryButtonLink,
            text: content.primaryButtonText
        });
    }

    if (!empty(content.secondaryButtonText) && !empty(content.secondaryButtonLink)) {
        buttons.push({
            link: content.secondaryButtonLink,
            text: content.secondaryButtonText
        });
    }

    if (!empty(content.thirdButtonText) && !empty(content.thirdButtonLink)) {
        buttons.push({
            link: content.thirdButtonLink,
            text: content.thirdButtonText
        });
    }

    model.buttons = buttons;
    
    var postTileType = content.type;
    if (postTileType.equals(featuredPost)) {
        model.isFeaturePost = true;
    } else if (postTileType.equals(disruptedPost)) {
        model.isDisrupted = true;
    }


    if (content.image) {
        model.image = {
            src: content.image.file.absURL,
            alt: content.image.file.alt
        };
    }

    return new Template('experience/components/assets/featuredPostTile').render(model).text;
};
