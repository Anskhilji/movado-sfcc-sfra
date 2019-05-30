'use strict';

$.validator.addMethod("productOptionMessage", function(value, element) {
    var vLines = value.split("\n");
    if (vLines.length > $(element).data('row-max')) {
        return false;
    } else {
        return !vLines.reduce((res, val) => {
            return !res ? (val.length > $(element).data('row-maxlength')) : res;
        }, false);
    }
}, $.validator.format(""));