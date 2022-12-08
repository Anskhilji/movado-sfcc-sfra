'use strict';

function generateAuthenticationPayLoad(service) {
    return service.URL;
}



module.exports = {
    generateAuthenticationPayLoad: generateAuthenticationPayLoad
}