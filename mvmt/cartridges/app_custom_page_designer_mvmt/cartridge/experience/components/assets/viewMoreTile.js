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
    model.isDisrupted = content.isDisrupted;
    var attr = context.getComponentRenderSettings().getAttributes() || new HashMap();
    attr.put('class', 'view-more-container');
    context.getComponentRenderSettings().setAttributes(attr);
    return new Template('experience/components/assets/viewMoreTile').render(model).text;
};
