'use strict';

module.exports = function(){
    this.getSettings = function () {
        return {
            custom: { 
                acceptTerms: true,
                accessToken: '',
                catalogId: ''
            }
        }     
    }
}