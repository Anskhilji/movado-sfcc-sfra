/**
 * Script to read file from impex location and populate Customers
 */

var CustomerMgr = require('dw/customer/CustomerMgr');
var File = require('dw/io/File');
var FileReader = require('dw/io/FileReader');
var Logger = require('dw/system/Logger');
var Status = require('dw/system/Status');
var Transaction = require('dw/system/Transaction');

var passwordPrefix = "=123Password";

function importCustomers() {

	/* params read*/
    var options = arguments[0];
    var inputFilePath = options.filePath;

    /* Mandatory param validation check*/
    if (inputFilePath == null)	{
        Logger.error('ImportCustomerForMovadoSales : error : required job parameters are missing : filePath');
        return new Status(Status.ERROR);
    }
    processCutomerFile(inputFilePath);
    Logger.debug('ImportCustomerForMovadoSales : success : File Processed Successfully');
    return new Status(Status.OK);
}

function processCutomerFile(inputFilePath) {

    try {
        var authenticateCustomerResult;
        var customerArrayObject;
        var customerNo;
        var error = {};
        var file = new File(inputFilePath);
        var fileReader = new FileReader(file);
        var firstName;
        var lastName;
        var line;
        var lineCounter = 0;
        var login;
        var newCustomer;
        var newCustomerProfile;
        var password;
        Transaction.wrap(function () {
            while ((line = fileReader.readLine()) != null) {
                lineCounter += 1;
                try {
                    // Spliting line using tab delimiter 
                    customerArrayObject = line.split('\t');
                    login = customerArrayObject[0];
                    customerNo = customerArrayObject[1];
                    firstName = customerArrayObject[2];
                    lastName = customerArrayObject[3];
                    storeNumber = customerArrayObject[4];
                    password = passwordPrefix + (Math.random() * 1000).toFixed();

                    newCustomer = CustomerMgr.createCustomer(login, password, customerNo);
                    authenticateCustomerResult = CustomerMgr.authenticateCustomer(login, password);
                    if (authenticateCustomerResult.status !== 'AUTH_OK') {
                        error = { authError: true, status: authenticateCustomerResult.status };
                        throw error;
                    }

                    // assign values to the profile
                    newCustomerProfile = newCustomer.getProfile();
                    newCustomerProfile.firstName = firstName;
                    newCustomerProfile.lastName = lastName;
                    newCustomerProfile.email = login;
                    newCustomerProfile.custom.storeNumber = storeNumber;
                    Logger.debug('ImportCustomerForMovadoSales : Cutomer created for line number: {0} and line: {1}', lineCounter, line);

                } catch (e) {
                    Logger.error('ImportCustomerForMovadoSales : Error : Failed to create customer for line number: {0} and line: {1} \n {2} \n {3} ', lineCounter, line, e, e.stack);
                }
            }
        });
    } catch (e) {
        Logger.error('ImportCustomerForMovadoSales : Failed to process file with Error : {0} \n {1}', e, e.stack);
    }

}

module.exports.importCustomers = importCustomers;