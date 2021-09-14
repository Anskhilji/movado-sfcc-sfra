 /**
* Purpose:	Sends the email address to Listrak to for subscription to newsletter/email list
*
*	@input CurrentHttpParameterMap	:	dw.web.HttpParameterMap
*	@output successTemplate			:	String
*	@output successContentAsset		:	String
*	@output errorTemplate			:	String
*	@output errorContentAsset		:	String
*
*/

var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Site = require('dw/system/Site');
var ISML = require('dw/template/ISML');

exports.Start = function start() {
    if (!dw.system.Site.current.preferences.custom.Listrak_Cartridge_Enabled)		{ return; }

    if (!empty(Site.getCurrent().getCustomPreferenceValue('Listrak_Signup')))	{
        var subpoints = Site.getCurrent().getCustomPreferenceValue('Listrak_Signup');
        var subpointList = [];
        for (var i = 0; i < subpoints.length; i++) { subpointList[i] = subpoints[i]; }

        ISML.renderTemplate('ltkSubPoints', { subpointcode: subpointList });
    }
};

exports.Start.public = true;
