'use strict';

/**
 * Kicks off loading onescript via template
 */
function start() {
    if (!dw.system.Site.current.preferences.custom.Listrak_Cartridge_Enabled) { return; }
    var ISML = require('dw/template/ISML');
    ISML.renderTemplate('ltkInclude');
}

exports.Start = start;
exports.Start.public = true;
