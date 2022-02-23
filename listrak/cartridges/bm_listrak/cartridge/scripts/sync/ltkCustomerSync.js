/**
* Purpose:	Exports Customers created or modified since last successful export. Customer file is sent to Listrak via FTP.
*/
// v 20.1.0
// Updated for compatibility mode 19.1

require('dw/customer');
require('dw/catalog');
require('dw/value');
require('dw/io');
require('dw/web');
require('dw/system');
require('dw/net');
require('dw/object');
importScript('sync/ltkExportUtils.js');
var Calendar = require('dw/util/Calendar');
/**
 * Builds flat file of customers to send to Listrak
 */
function customerSync() {
    var enabled = dw.system.Site.current.preferences.custom.Listrak_CustomerExport_Enabled
    && dw.system.Site.current.preferences.custom.Listrak_Cartridge_Enabled;

    if (!empty(enabled) && !enabled) {
        return;
    }
    var calendar = new Calendar();
    var currentExportStartTime = calendar.getTime().toISOString();
    var lastExport = new ltkExportInfo('lastCustomerExportDate');
 	var lastExportDate = lastExport.GetValueAsDate();

    calendar.set(Calendar.DATE, calendar.get(Calendar.DATE) - 90); // 30 days before the current date
    var maxHistoryDate = calendar.getTime();

    if (empty(lastExportDate) || maxHistoryDate > lastExportDate)	{
        lastExportDate = maxHistoryDate;
    }

    var customers = dw.object.SystemObjectMgr.querySystemObjects('Profile', 'lastModified >= {0} ', 'lastName, firstName', lastExportDate);

    if (customers.hasNext())	{
        var customerfile = new ExportFile('Customers_DW.txt');

		// //////// Write header row //////////
        customerfile.AddRowItem('Email');
        customerfile.AddRowItem('FirstName');
        customerfile.AddRowItem('LastName');
        customerfile.AddRowItem('Gender');
        customerfile.AddRowItem('Birthday');
        customerfile.AddRowItem('ZipCode');
        customerfile.AddRowItem('CustomerNumber');
        customerfile.AddRowItem('Registered');
		// Modification - D.Gomez Add Customer Groups since v16.3
        customerfile.AddRowItem('CustomerGroup');
		// End Mod
        customerfile.WriteRow();

		// //////// Write product rows //////////
        while (customers.hasNext())		{
            var customer = customers.next();

			// Email
            customerfile.AddRowItem(customer.email, true);

			// First Name
            customerfile.AddRowItem(customer.firstName, true);

			// Last Name
            customerfile.AddRowItem(customer.lastName, true);

			// Gender
            customerfile.AddRowItem(MapGender(customer.gender.getDisplayValue()), true);

			// Birthday
            customerfile.AddRowItemAsDate(customer.birthday, true);

			// PostalCode
            var postalCode = '';
            if (customer.addressBook != null) {
                if (customer.addressBook.preferredAddress != null) {
                    postalCode = customer.addressBook.preferredAddress.postalCode;
                } else
                    if (!empty(customer.addressBook.addresses)) {
                        if (customer.addressBook.addresses.size() > 0) {
                            postalCode = customer.addressBook.addresses[0].postalCode;
                        }
                    }
            }
            customerfile.AddRowItem(postalCode, true);

			// Customer Number
            customerfile.AddRowItem(customer.customerNo, true);

			// Registered User
            customerfile.AddRowItem(true, true);

			// Modification - D.Gomez Add Customer Groups since v16.3
            var custGroups = '';
            for (var count = 0; count < customer.customer.customerGroups.length; count++) {
                if (count > 0) { custGroups += ','; }
                custGroups += customer.customer.customerGroups[count].getID();
            }
            customerfile.AddRowItem(custGroups, true);
            customerfile.WriteRow();
			// End Mod
        }
        customers.close();
        var result = customerfile.SubmitFile();
        if (result === false)		{
            return;
        }

        customerfile.Delete();
        lastExport.SetValue(currentExportStartTime);
    }
}

/**
 * Maps gender to M or F
 * @param {*} gender input value
 * @returns {*} single character value
 */
function MapGender(gender) {
    gender = gender.toLowerCase();
    if (gender === 'female' || gender === 'f')	{
        return 'F';
    }	else if (gender === 'male' || gender === 'm')	{
        return 'M';
    }

    return 'N';
}

exports.customerSync = customerSync;
