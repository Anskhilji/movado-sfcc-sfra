'use strict';

function capitalizeString(string) {
    return string.toLowerCase().replace(/\b[a-z]/g, function (letter) {
        return letter.toUpperCase();
    });
}


module.exports = {
    capitalizeString: capitalizeString
};
