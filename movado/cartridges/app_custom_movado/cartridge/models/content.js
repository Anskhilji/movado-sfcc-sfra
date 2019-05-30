'use strict';

var Content = module.superModule;

/**
 * extend is use to extend super module
 * @param target - super module
 * @param source - child module
 */
function extend(target, source) {
    var _source;

    if (!target) {
        return source;
    }

    for (var i = 1; i < arguments.length; i++) {
        _source = arguments[i];
        for (var prop in _source) {
            // recurse for non-API objects
            if (
                _source[prop] &&
                typeof _source[prop] === 'object' &&
                !_source[prop].class
            ) {
                target[prop] = this.extend(target[prop], _source[prop]);
            } else {
                target[prop] = _source[prop];
            }
        }
    }

    return target;
}

/**
 * Represents content model
 * @param  {dw.content.Content} contentValue - result of ContentMgr.getContent call
 * @param  {string} renderingTemplate - rendering template for the given content
 * @return {void}
 * @constructor
 */
function content(contentValue, renderingTemplate) {
    var contentModel = new Content(contentValue, renderingTemplate);
    contentObject = extend(contentModel, {
        isLeftNav:
            (contentValue &&
                contentValue.custom &&
                contentValue.custom.isLeftNav) ||
            null,
        raw: contentValue
    });
    return contentObject;
}

module.exports = content;
