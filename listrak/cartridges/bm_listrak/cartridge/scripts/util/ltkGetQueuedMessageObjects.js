/**
* Purpose:	Loads a seekableIterator with message objects that will be sent to Listrak in ltkDataSync pipeline
*
*	@output ltkMessageObjects		:	dw.util.SeekableIterator
*
*/

require('dw/system');
require('dw/util');
require('dw/object');

/**
 * Loads custom object data to send to listrak
 * @param {*} args input
 */
function execute(args) {
    var messageObjects = CustomObjectMgr.queryCustomObjects('ltk_messageObject', 'custom.sentStatus = false', 'lastModified');
    args.ltkMessageObjects = messageObjects;

	/* Close the SeekableIterator object. */
    messageObjects.close();
}
