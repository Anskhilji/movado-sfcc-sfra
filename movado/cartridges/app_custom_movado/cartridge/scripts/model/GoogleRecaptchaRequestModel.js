'use strict';

function generateAuthenticationPayLoad(token, service) {
    return service.URL;
}



module.exports = {
    generateAuthenticationPayLoad: generateAuthenticationPayLoad
}