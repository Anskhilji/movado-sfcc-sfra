'use strict';

module.exports = function(folder, filename){
    this.SEPARATOR = '/';
    this.IMPEX = '/IMPEX/'

    if(!filename){
        this.fullPath = folder;
    }else{
        this.fullPath = folder.fullPath + filename;
    }

    this.name = filename;
    this.path = filename;
    this.exists = function(){return true};
    this.mkdirs = function(){return true};
    this.isDirectory = function(){return false};
    this.getName = function() { return {
        split: function() {
            return {
                pop: function() {
                    return {
                        toLowerCase: function () {
                            
                        }
                    }
                }
            }
        },
        toLowerCase: function () {
            return {
                endsWith: function () {
                    return true
                }
            }
        },
    }};
};