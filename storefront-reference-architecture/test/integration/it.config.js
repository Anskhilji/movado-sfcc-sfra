'use strict';

var minimist = require('minimist');
var argv = minimist(process.argv.slice(2));
var getConfig = require('@tridnguyen/config');

var opts = Object.assign({}, getConfig({
    baseUrl: 'https://REPLACE.ME',
    suite: '*',
    reporter: 'spec',
    timeout: 60000,
    locale: 'x_default'
}, './config.json'), argv);

module.exports = opts;
