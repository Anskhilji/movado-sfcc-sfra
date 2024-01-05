'use strict';
var Status = require('dw/system/Status');

exports.execute = function (args) {
  return new Status(Status.OK, 'OK');
}