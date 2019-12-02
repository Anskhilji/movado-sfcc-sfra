'use strict'

var rp = require('request-promise');

console.log("Starting code activation");
var args = process.argv;

//Command line argument must be in following order
//args[3] = hostname
//args[4] = username
//args[5] = password
//args[6] = client_id
//args[7] = client_secret
//args[8] = code_version

if (args.length < 8) {
    console.log('Please provide required options');
    return;
}

var accessToken;
var hostName = args[2];
var username = args[3];
var password = args[4];
var clientID = args[5];
var clientSecret = args[6];
var codeVersion = args[7];

var base64EncodedAuthString = Buffer.from(username + ':' + password + ':' + clientSecret).toString('base64');
//Build options for request to get access-token
var options = {
    method: 'POST',
    baseUrl: 'https://' + hostName,
    url: 'dw/oauth2/access_token',
    qs: {
        client_id: clientID
    },
    headers: {
        Authorization: 'Basic ' + base64EncodedAuthString
    },
    form: {
        grant_type: 'urn:demandware:params:oauth:grant-type:client-id:dwsid:dwsecuretoken'
    }
};

rp(options)
.then((body) => {
    if(body) {
        var bodyObj = JSON.parse(body);
        if (bodyObj.hasOwnProperty('access_token')){
            console.log('Access token found');
            accessToken = bodyObj.access_token;
            //Going to build options for request to activate code version
            options.method = 'PATCH';
            options.url = 's/-/dw/data/v19_10/code_versions/' + codeVersion;
            options.json = true;
            options.body = {
                active: true
            };
            options.auth = {
                'bearer': accessToken
            };
            //Delete objects which no longer required
            delete options.qs;
            delete options.headers;
            delete options.form;
            //Going to activate code version
            console.log('Starting code activation for code version ' + codeVersion);
            rp(options)
            .then((body) => {
                if (body) {
                    console.log('Code version ' + codeVersion + ' has been activated successfully');
                    console.log(body);
                }
            }).catch((error) => {
                console.log('Error occured while activating code version ' + codeVersion);
                console.log(error);
            });
        }
    }
}).catch((error) => {
    console.log('Error occured while retrieving access token ');
    console.log(error);
});


