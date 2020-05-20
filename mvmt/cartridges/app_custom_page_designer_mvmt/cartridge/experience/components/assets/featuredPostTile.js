'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');

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
    model.buttons = [];

    var additionalButtons;
    if (!empty(additionalButtons)) {
        additionalButtons = JSON.parse(content.additionalButtons);
    }
    if(content.primaryButtonText && content.primaryButtonLink) {
        button.text = content.primaryButtonText;
        button.url = content.primaryButtonLink;
        model.buttons.push(button);
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
