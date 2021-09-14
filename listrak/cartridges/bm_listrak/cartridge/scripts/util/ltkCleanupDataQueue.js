/* eslint-disable no-unused-vars */
/**
* Purpose:	Removes data objects that are more than 14 days old
*
*/
require('dw/system');
require('dw/util');
require('dw/object');
/**
 * Runs custom object cleanup
 * @param {*} args input
 */
function execute(args) {
 	var dateArg = null;
 	var calendar = new Calendar();
    calendar.set(Calendar.DATE, calendar.get(Calendar.DATE) - 14); // 14 days before current date
    dateArg = calendar.getTime();

    var messageObjects = CustomObjectMgr.queryCustomObjects('ltk_dataObject', 'creationDate < {0}', 'lastModified', dateArg);
    while (messageObjects.hasNext()) {
        var object = messageObjects.next();
        CustomObjectMgr.remove(object);
    }

	/* Close the SeekableIterator object. */
    messageObjects.close();
}
