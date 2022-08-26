"use strict";

/*
	An instance of CSVModelReader converts a csv file's lines into a native objects. Each line in the file below the column headers
	is converted into an object where the properties of the object are the corresponding column names. an instance of ModelGenerator
	supports both iterator style and whole file object creation. see examples below.

	Constructor parameters:

	layout - an object the contains a mapping from file column name to constructed object property name. Used for finer control over
			the objects created. A "" placed for the value in the object tells the instance to disregard this column/value when the object
			is created. layout is nullable. In this case the column headers in the file will be used as properties of the
			object created

	delimiter - a string value that represents the separator for the line items in a csv file. nullable. defaults to ','

	encoding - a string value that represents the encoding required to read the file. nullable. defaults to 'utf-8'

	See the Usage examples below.
*/

var dw_io = require("dw/io");
var misc_util = require("~/cartridge/scripts/util/Miscellaneous.js");

function CSVModelReader(layout, delimiter, encoding) {
    this.modelLayout = layout;
    this.delimiter = delimiter === null ? "," : delimiter;
    this.encoding = encoding === null ? "utf-8" : encoding;
    this.columns = null;
    this.fileReader = null;

    this.shouldReadHeader = true;
}

CSVModelReader.prototype.createModelObjectsFromFile = function (file) {
    var fileReader = dw_io.FileReader(file, this.encoding);
    if (!fileReader) {
        throw new Error("File read error");
    }
    if (this.shouldReadHeader) {
        var headers = fileReader.readLine();
        if (!headers) {
            throw new Error(
                "Invalid csv file format. No headers found or set shouldReadHeader property to false"
            );
        }
        this.columns = trimValue(headers).split(this.delimiter);
    }

    var modelObjects = [];
    var newLine = fileReader.readLine();
    while (!!newLine) {
        var rawLine = newLine;
        newLine = trimValue(newLine).split(this.delimiter);
        if (!this.columns || newLine.length === this.columns.length) {
            var obj = createObjectFromLine(
                newLine,
                this.columns,
                this.modelLayout
            );
            obj["fileLine"] = rawLine;
            modelObjects.push(obj);
        }
        newLine = fileReader.readLine();
    }
    return modelObjects;
};

CSVModelReader.prototype.setFile = function (file) {
    this.fileReader = dw_io.FileReader(file, this.encoding);
    if (!this.fileReader) {
        throw new Error("File read error");
    }
    if (this.shouldReadHeader) {
        var headers = this.fileReader.readLine();
        if (!headers) {
            throw new Error(
                "Invalid csv file format. No headers found or set shouldReadHeader property to false"
            );
        }
        this.columns = trimValue(headers).split(this.delimiter);
    }
};

CSVModelReader.prototype.nextLineObject = function () {
    checkValidUsage(this.fileReader);
    var newLine = trimValue(this.fileReader.readLine());
    if (!!newLine) {
        //var trimmedLine = trimValue(newLine).split(this.delimiter);
        var trimmedLine = csvToArray(newLine);
        if (!this.columns || trimmedLine.length === this.columns.length) {
            var lineObject = createObjectFromLine(
                trimmedLine,
                this.columns,
                this.modelLayout
            );
            lineObject["fileLine"] = newLine;
            return lineObject;
        }
    }
    return null;
};
exports.CSVModelReader = CSVModelReader;

/* Return array of string values, or NULL if CSV string not well formed. */
function csvToArray(text) {
    // Return NULL if input string is not well formed CSV string.
    if (!misc_util.re_valid.test(text)) return null;
    var a = []; // Initialize array to receive values.
    text.replace(
        misc_util.re_value, // "Walk" the string using replace with callback.
        function (m0, m1, m2, m3) {
            // Remove backslash from \' in single quoted values.
            if (!!m1) a.push(m1.replace(/\\'/g, "'"));
            // Remove backslash from \" in double quoted values.
            else if (!!m2) a.push(m2.replace(/\\"/g, '"'));
            else if (!!m3) a.push(m3);
            return ""; // Return empty string.
        }
    );
    // Handle special case of empty last value.
    if (/,\s*$/.test(text)) a.push("");
    return a;
}
/*	Private functions	*/
function createObjectFromLine(line, columns, modelLayout) {
    var obj = {};
    for (var i = 0; i < line.length; i++) {
        var property = columns === null ? i : columns[i];
        if (!!modelLayout) {
            property = modelLayout[property];
        }
        if (!!property) {
            var value = trimValue(line[i]);
            obj[property] = value === "" ? null : value;
        }
    }
    return obj;
}
function trimValue(line) {
    if (!line || line.length === 0 || line === "" || line === "") return line;
    return line.replace(/[\']/g, "");
}
function checkValidUsage(reader) {
    if (!reader)
        throw new Error(
            "setFile() must be called before attempting to reading objects"
        );
}
/*

Usage Examples:
	**** Read entire csv file and return an array of objects where each object represents a line in the csv ****
	var modelLayout = {
		"Order#" : "orderNumber",
		"Pick Ticket" : "pickTicket",
		"PO" : "PO",
		"Bill To Name" : "billToName"
	}
	var delimiter = "\t" 	//tab delimited
	var encoding = "utf-8"
	var modelReader = new CSVModelReader(modelLayout, delimiter, encoding)
	var file = new dw_io.File(pathToMyFile)
	var lineObjects = modelReader.createModelObjects(file)
	...process lineObjects as needed

    *****	Read csv file using iterator style	*****
	...configure parameters as above example
	var modelReader = new CSVModelReader(modelLayout, delimiter, encoding)

	for (var i = 0; i < array_of_file_objects.length; i++) {
		var file = array_of_file_objects[i]
		modelReader.setFile(file)
		var nextObject = modelReader.nextLineObject()
		while(nextObject != null) {
			...process nextObject as needed
			nextObject = modelReader.nextLineObject()
		}
	}
*/
