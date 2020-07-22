'use strict';

var ContentMgr = require('dw/content/ContentMgr');
var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');

/**
 * Check if content Asset is online
 * 
 * @param  {string} contentAssetID
 * @returns {boolean} 
 */
function isContentAssetEnabled(contentAssetID) {
    var contentAsset = ContentMgr.getContent(contentAssetID);
    if (contentAsset && contentAsset.online && !empty(contentAsset.custom.body)) {
        return true;
    }
    return false;
}

/**
 * Render logic for the Content Asset
 * 
 * @param {dw.experience.PageScriptContext} context The page script context object.
 * @returns {string} The Template text.
 */
module.exports.render = function (context) {
    var model = new HashMap();
    var content = context.content;
    var contentAssetID = content.contentAssetID;

    if (!empty(contentAssetID)) {
        model.contentAssetID = contentAssetID;
        model.isContentAssetEnabled = isContentAssetEnabled(contentAssetID);
    } else {
        model.isContentAssetEnabled = false;
    }
    return new Template('experience/components/assets/contentAsset').render(model).text;
};
