/**
 *
 * OrderGuard JS Execution
 * 
 * Parameters:
 * maxAge: Number -- maximum age of the most recent order found, in minutes.
 * notifyTo: String -- email address to send notifications to.
 * 
 */


function execute(args) {
	var OrderMgr = require('dw/order/OrderMgr'),	
	orderStartDate = new Date(Date.now() - (args.maxAge * 60000)),
	queryString = getSearchOrderQuery(orderStartDate),
	orders = OrderMgr.searchOrders(queryString, null),
	count = orders.getCount();
	orders.close();

	if(count > 0) return;

	sendMail(args.notifyTo, orderStartDate);

	return;
}

/**
 *For getting queryString of orders
 */
function getSearchOrderQuery(orderStartDate) {

	var Calendar = require('dw/util/Calendar'),
	StringUtils = require("dw/util/StringUtils"),
	Order = require('dw/order/Order');

	queryParams = [
		Order.PAYMENT_STATUS_PAID,
		StringUtils.formatCalendar(new Calendar(orderStartDate), "yyyy-MM-dd'T'HH:mm:ss'+Z'")
		];

	var queryString = 'paymentStatus = {0} ' +
	"AND creationDate >= {1}";

	return StringUtils.format(queryString, queryParams);
}

/**
 *For sending mail If no orders below the minimum age were found
 */
function sendMail(notifyTo, orderStartDate){
	var Resource = require('dw/web/Resource');
	var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
	var Site = require('dw/system/Site');

	var objectForEmail = {
			warning : Resource.msg('orderguard.warning', 'jobs', null),
			timeStamp : orderStartDate,
			noPaidOrders : Resource.msg('orderguard.nopaidorders', 'jobs', null),
			checkBusinessManager : Resource.msg('orderguard.checkbusinessmanager', 'jobs', null)

	};
	var emailObj = {
			to: notifyTo,
			from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@salesforce.com',
			subject: Resource.msg('orderguard.failure.notification', 'jobs', null)
	};

	emailHelpers.sendEmail(emailObj, 'orderguard/failure.isml', objectForEmail);
}

module.exports.execute = execute;


