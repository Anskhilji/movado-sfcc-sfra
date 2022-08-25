/* eslint-disable no-unused-vars */
// eslint-disable-next-line no-unused-vars
/**
* Purpose:	Records error information to be sent to Listrak in ltk_messageObject custom object. Messages are later sent by ltkProcessing scheduled job.
* 20.1
*/
require('dw/value');
require('dw/io');
require('dw/web');
require('dw/system');
require('dw/net');
require('dw/object');

var Utils = require('dw/util');
var Logger = require('dw/system/Logger');
/**
 * Logs cartridge errors
 * @param {*} message error message
 * @param {*} severity severity of error
 * @param {*} callingScript where error is thrown
 */
function reportError(message, severity, callingScript) {
	/* Only log the exception if we have it enabled.  Clients can disable
	 * it to ensure that custom object usage doesn't get out of control. */
    var enabled = dw.system.Site.current.preferences.custom.Listrak_LogExceptions;

    if (enabled)	{
        var logger = Logger.getLogger('ListrakLogs', 'LTKLog');

        var Transaction = require('dw/system/Transaction');
        Transaction.begin();
        var messageUID = Utils.UUIDUtils.createUUID();
        var ltkMessage = dw.object.CustomObjectMgr.createCustomObject('ltk_messageObject', messageUID);

        ltkMessage.custom.version = 'int_Listrak 1.0.0';

        switch (severity) {
            case 'Information' :
                ltkMessage.custom.messageSeverity = 'Information';
                break;
            case 'Low':
                ltkMessage.custom.messageSeverity = 'Low';
                break;
            case 'Medium':
                ltkMessage.custom.messageSeverity = 'Medium';
                break;
            case 'High':
                ltkMessage.custom.messageSeverity = 'High';
                break;
            case 'Critical':
                ltkMessage.custom.messageSeverity = 'Critical';
                break;
            default :
                ltkMessage.custom.messageSeverity = 'Medium';
        }

        ltkMessage.custom.scriptName = callingScript;
        ltkMessage.custom.message = message;
        ltkMessage.custom.sentStatus = false;
        Transaction.commit();
        logger.error(message + ' ' + severity + ' ' + callingScript);
    }
}

/**
 * Formats strings
 * @param {*} messageObject input
 * @returns {*} message formatted input
 */
function errorMessageToString(messageObject) {
    var message = messageObject.custom.messageSeverity.getDisplayValue() + ' ';
    message += '[version:' + messageObject.custom.version + '] [ScriptName:' + messageObject.custom.scriptName + ']  ' + messageObject.custom.message;
    return message;
}


exports.reportError = reportError;
