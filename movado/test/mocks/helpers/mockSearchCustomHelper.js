'use strict';

var Utils = {
    url : function(param1,param2,param3){
        return "url";
    }
};

var Resource = {
    msg : function(param1,param2,param3){
        return "msg";
    }
};

var ContentSearchModel = function(){
    return {
        setRecursiveFolderSearch : function(param1){
            return "a";
        },
        setFolderID : function(){
            return "b";
        },
        search : function(){

        }
    };
}

var FolderSearch = function(param1,param2){
    return "a";
}

module.exports = {
    Utils,
    Resource,
    ContentSearchModel,
    FolderSearch
}