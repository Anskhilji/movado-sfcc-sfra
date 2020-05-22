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
    var button = {
            text: '',
            url: ''
        };
    var content = context.content;
    model.title = content.title;
    model.link = content.link;
    model.subheading = content.subheading;
    model.excerpt = content.excerpt;
    
    // Post Buttons
    model.buttons = new Array();
    if (!empty(content.primaryButtonText) && !empty(content.primaryButtonLink)) {
        model.buttons.push({
            link: content.primaryButtonLink,
            text: content.primaryButtonText
        });
    }

    if (!empty(content.secondaryButtonText) && !empty(content.secondaryButtonLink)) {
        model.buttons.push({
            link: content.secondaryButtonLink,
            text: content.secondaryButtonText
        });
    }

    if (!empty(content.thirdButtonText) && !empty(content.thirdButtonLink)) {
        model.buttons.push({
            link: content.thirdButtonLink,
            text: content.thirdButtonText
        });
    }

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

    // if (!empty(additionalButtons)) {
    //     additionalButtons.forEach(additionalButton => {
    //         if(additionalButton.text && additionalButton.url) {
    //             model.buttons.push(button);
    //         }
    //     });
    // }

    return new Template('experience/components/assets/featuredPostTile').render(model).text;
};
