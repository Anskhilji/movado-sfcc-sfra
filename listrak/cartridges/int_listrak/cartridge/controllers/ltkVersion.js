/**
* Description of the Controller and the logic it provides
*
* @module  controllers/ltkVersion
*/
'use strict';


/**
 * Renders template to display cartridge version externally
 */
function show() {
    if (!dw.system.Site.current.preferences.custom.Listrak_Cartridge_Enabled)		{ return; }
    var ISML = require('dw/template/ISML');
    ISML.renderTemplate('ltkVersion.isml');
}

exports.Show = show;
exports.Show.public = true;
