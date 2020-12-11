'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');

/**
 * Render logic for the assets.productTile.
 * 
 * @param {dw.experience.PageScriptContext} context The page script context object.
 * @returns {string} The Template text.
 */
module.exports.render = function (context) {
    var content = context.content;
    var model = new HashMap();
    model.product = content.product;
    model.ratings = content.ratings;
    model.swatches = content.swatches;
    model.plpTile = content.plpTile;
    model.showAddToCart = content.showAddToCart;
    model.tileSize = content.tileSize;

    return new Template('experience/components/assets/producttile').render(model).text;
};