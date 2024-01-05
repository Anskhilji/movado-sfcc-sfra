'use strict';

const SVC_FILTER_KEYS = require('*/cartridge/scripts/social/utils/serviceFilterKeys');

const ServiceHelpers = {
    prepareFormLogData: function (data) {
        if (!data) return '';

        var result = '\n';
        var params = data.split('&');
        params.forEach(function (param) {
            var paramArr = param.split('=');
            var key = paramArr[0];
            var value = paramArr.length > 1 ? paramArr[1] : null;
            if (key !== null) {
                if (key && SVC_FILTER_KEYS.FILTER_KEYS.indexOf(String(key).toLowerCase()) > -1) {
                    value = '*****';
                }
                if (value !== null) {
                    result += decodeURIComponent(key + '=' + value) + '\n';
                } else {
                    result += decodeURIComponent(key) + '\n';
                }
            }
        });

        return result;
    },

    prepareXmlLogData: function (data) {
        var filteredData = data;
        SVC_FILTER_KEYS.FILTER_KEYS.forEach(function (key) {
            filteredData = filteredData.replace(new RegExp('(<' + key + '>)(.*)(</' + key + '>)', 'gm'), '<' + key + '>********</' + key + '>');
            filteredData = filteredData.replace(new RegExp('(<custom-attribute attribute-id="' + key + '">)(.*)(</custom-attribute>)', 'gm'), '<custom-attribute attribute-id="' + key + '">********</custom-attribute>');
        });
        return filteredData;
    },

    forEachIn: function (iterable, functionRef) {
        Object.keys(iterable).forEach(function (key) {
            functionRef(key, iterable[key]);
        });
    },

    isArray: function (element) {
        return Array.isArray(element);
    },

    isObject: function (element) {
        return typeof element === 'object';
    },

    isIterable: function (element) {
        if (!element) return false;
        return ServiceHelpers.isArray(element) || ServiceHelpers.isObject(element);
    },

    iterate: function (object, parent) {
        if (ServiceHelpers.isIterable(object)) {
            ServiceHelpers.forEachIn(object, function (key, value) {
                if (key !== null) {
                    if (SVC_FILTER_KEYS.FILTER_KEYS.indexOf(String(key).toLowerCase()) > -1) {
                        value = '*****'; // eslint-disable-line no-param-reassign
                        object[key] = value; // eslint-disable-line no-param-reassign
                    }
                }
                ServiceHelpers.iterate(value, parent);
            });
        }
        return object;
    }
};

module.exports = ServiceHelpers;
