'use strict';

module.exports = function(){
    this.getService = function () {
        return {
            call: function () {
                return {
                    ok: true,
                    object : {
                        text: '{"code":0}'
                    },
                }
            }
        }   
    },
    this.convertToMultiPartParam = function() {

    },
    this.convertToMultiPartFile = function() {

    } 
}