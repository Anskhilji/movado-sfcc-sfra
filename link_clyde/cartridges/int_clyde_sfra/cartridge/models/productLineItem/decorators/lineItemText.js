'use strict';

module.exports = function (object, lineItem) {
    Object.defineProperty(object, 'lineItemText', {
        enumerable: true,
        value: lineItem.lineItemText
    });
};
