/**
* Purpose:	Loads a seekableIterator with data objects that will be sent to Listrak in ltkDataSync pipeline
*
*	@output ltkDataObjects		:	dw.util.SeekableIterator
*	@output ltkErrorCount		:	Number
*/
require('dw/system');
require('dw/util');
require('dw/object');

/**
 * Loads custom object data to send to listrak
 * @param {*} args input
 */
function execute(args) {
    var dataObjects = CustomObjectMgr.queryCustomObjects('ltk_dataObject', '', 'lastModified');
    args.ltkDataObjects = dataObjects;

    args.ltkErrorCount = 0;

	/* Close the SeekableIterator object. */
    dataObjects.close();
}
