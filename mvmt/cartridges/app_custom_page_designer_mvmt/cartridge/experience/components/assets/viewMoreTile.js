'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');

/**
 * Render logic for the assets.viewMoreTile.
 * 
 * @param {dw.experience.PageScriptContext} context The page script context object.
 * @returns {string} The Template text.
 */
module.exports.render = function (context) {
    var model = new HashMap();
    var content = context.content;
    model.title = content.title;
    model.link = content.link;
    model.pointerText = content.pointerText;
    return new Template('experience/components/assets/viewMoreTile').render(model).text;
};
