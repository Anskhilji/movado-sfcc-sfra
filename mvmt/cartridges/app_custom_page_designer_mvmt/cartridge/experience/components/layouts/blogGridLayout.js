'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');
var PageRenderHelper = require('*/cartridge/experience/utilities/PageRenderHelper.js');

/**
 * Render logic for the layouts.blogGridLayout.
 * 
 * @param {dw.experience.PageScriptContext} context The page script context object.
 * @returns {string} The Template text.
 */
module.exports.render = function (context) {
    var model = new HashMap();
    var content = context.content;
    model.regions = PageRenderHelper.getRegionModelRegistry(context.component);
    var isTwoColumn = content.isTwoColumn;
    var gridComponents = model.regions.columns;
    if (isTwoColumn) {
        gridComponents.setClassName("grid-container-two");
    } else {
        gridComponents.setClassName("grid-container");
    }
    model.gridComponents = gridComponents; 

    model.id = 'blogGridLayout-' + PageRenderHelper.safeCSSClass(context.component.getID());

    return new Template('experience/components/layouts/blogGridLayout').render(model).text;  
};
