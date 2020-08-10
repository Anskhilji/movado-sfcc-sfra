'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');

/**
 * Render logic for the assets.dreamersAndDisruptersSection.
 * 
 * @param {dw.experience.PageScriptContext} context The page script context object.
 * @returns {string} The Template text.
 */
module.exports.render = function (context) {
    var model = new HashMap();
    var content = context.content;
    model.backgroundImage = {
        src: content.backgroundImage.file.absURL,
        alt: content.backgroundImage.file.alt
    };
    model.primaryImage = {
        src: content.primaryImage.file.absURL,
        alt: content.primaryImage.file.alt 
    };
    model.richText = content.richText;
    return new Template('experience/components/assets/dreamersAndDisruptersSection').render(model).text;
};
