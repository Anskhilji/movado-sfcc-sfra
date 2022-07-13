/* global exports require */

var dw_system = require("dw/system");
var dw_util = require("dw/util");

const re_valid =
    /^\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*(?:,\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*)*$/;
const re_value =
    /(?!\s*$)\s*(?:'([^'\\]*(?:\\[\S\s][^'\\]*)*)'|"([^"\\]*(?:\\[\S\s][^"\\]*)*)"|([^,'"\s\\]*(?:\s+[^,'"\s\\]+)*))\s*(?:,|$)/g;

function generateUUID() {
    return dw_util.UUIDUtils.createUUID();
}

function tryCastBoolean(candidate, bDefault) {
    if (candidate == null) return bDefault;

    switch (String(candidate).trim().toUpperCase()) {
        case "1":
        case "TRUE":
        case "Y":
        case "YES":
            return true;
        case "0":
        case "FALSE":
        case "N":
        case "NO":
            return false;
        case "":
        default:
            return bDefault;
    }
}

function tryCastNumber(candidate, nDefault) {
    if (candidate == null) return nDefault;

    if (String(candidate).trim() == "") return nDefault;

    if (isNaN(candidate)) return nDefault;

    return Number(candidate);
}

function GmtOffsetAndFormat(dt, gmtOffsetHours) {
    if (dt == null) return "";

    if (String(dt).trim() == "") return "";

    dt.setHours(dt.getHours() + gmtOffsetHours);

    var month = dt.getMonth() + 1; // it returns 0-11
    var strMonth =
        String(month).length == 1 ? "0" + String(month) : String(month);
    var strDate =
        String(dt.getDate()).length == 1
            ? "0" + String(dt.getDate())
            : String(dt.getDate());
    var strHours =
        String(dt.getHours()).length == 1
            ? "0" + String(dt.getHours())
            : String(dt.getHours());
    var strMinutes =
        String(dt.getMinutes()).length == 1
            ? "0" + String(dt.getMinutes())
            : String(dt.getMinutes());
    var strSeconds =
        String(dt.getSeconds()).length == 1
            ? "0" + String(dt.getSeconds())
            : String(dt.getSeconds());
    var strMilliseconds = "";

    switch (String(dt.getMilliseconds()).length) {
        case 1:
            strMilliseconds = "00" + String(dt.getMilliseconds());
            break;
        case 2:
            strMilliseconds = "0" + String(dt.getMilliseconds());
            break;
        default:
            strMilliseconds = String(dt.getMilliseconds());
            break;
    }

    return (
        dt.getFullYear() +
        "-" +
        strMonth +
        "-" +
        strDate +
        "T" +
        strHours +
        ":" +
        strMinutes +
        ":" +
        strSeconds +
        "." +
        strMilliseconds
    );
}

function logMessage(context, msg, logType) {
    if (logType == null) {
        logType = "error";
    }

    logType = logType.toUpperCase();

    var logger = dw_system.Logger.getLogger("oms_customization");
    var message = context + ":  " + msg;

    if (logType == "WARN") {
        logger.warn(message);
    } else if (logType == "DEBUG") {
        logger.debug(message);
    } else if (logType == "INFO") {
        logger.info(message);
    } else if (logType == "FATAL") {
        logger.fatal(message);
    } else {
        logger.error(message);
    }
}

function generateGuid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return (
        s4() +
        s4() +
        "-" +
        s4() +
        "-" +
        s4() +
        "-" +
        s4() +
        "-" +
        s4() +
        s4() +
        s4()
    );
}

function generateStartMarker() {
    return new Date();
}

function shouldContinueWithMarker(marker, threshold) {
    var currentMarker = new Date();

    var intThreshold = threshold;

    if (typeof intThreshold !== "number") {
        intThreshold = parseInt(intThreshold);
    }

    var timeSince = (currentMarker - marker) / 1000;

    if (timeSince >= intThreshold) {
        return false;
    }
    return true;
}

function toCurrency(n) {
    return "$" + n.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, "$1,");
}

// to prevent the result set of > 50 objects. Currently, if we try to call for more than 50, it'll return this error:
// [APIException: dw.om.OMSystemException: IOException thrown, message: StatusCode:500 StatusLine:HTTP/1.1 500 ( The request was rejected by the HTTP filter. Contact the server administrator.  )]
function partitionArray(arr, split) {
    var start = 0;
    var partitions = [];
    while (start < arr.length) {
        var end = start + split;
        partitions.push(arr.slice(start, end));
        start = end;
    }
    return partitions;
}

/* #region Exports of helper functions */
exports.re_valid = re_valid;
exports.re_value = re_value;
exports.generateUUID = generateUUID;
exports.tryCastBoolean = tryCastBoolean;
exports.tryCastNumber = tryCastNumber;
exports.GmtOffsetAndFormat = GmtOffsetAndFormat;
exports.logMessage = logMessage;
exports.generateGuid = generateGuid;
exports.generateStartMarker = generateStartMarker;
exports.shouldContinueWithMarker = shouldContinueWithMarker;
exports.toCurrency = toCurrency;
exports.partitionArray = partitionArray;
/* #endregion */
