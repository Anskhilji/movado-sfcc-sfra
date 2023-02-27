
 var dw_system = require("dw/system");
 var dw_om_common = require("dw/om/common");
 var dw_util = require("dw/util");
 var dw_net = require("dw/net");
 var dw_io = require("dw/io");
 
 //A simple function that takes a string, which may include underscores, and converts it to camel case.
 
function camelCase(str) {
  var components = str.split("_");
  for (var i = 0; i < components.length; i++) {
    var component = components[i];
    var capped = component[0].toUpperCase() + component.slice(1);
    components[i] = capped;
  }
  return components.join("");
 }
 
 //Function to parse the object type
 
 function parseType(type) {
  var spec = type.split(' ')[1];
  return spec.substring(0, spec.length - 1);
}

// Write a single element to a dw.io.XMLIndentingStreamWriter object

 function singleElement(XMLISWriter,elementName,elementValue) {
   if (elementValue !== "" && ["\r","\n","\s"].indexOf(elementValue) == -1) { 
     if (typeof elementValue !== 'string') {
       elementValue = elementValue.toString();
     }
   XMLISWriter.writeStartElement(elementName);
   XMLISWriter.writeCharacters(elementValue);
   XMLISWriter.writeEndElement();
  } else {
    XMLISWriter.writeEmptyElement(elementName);
  }
}

function hasProperties(obj) {
  for(var key in obj) {
	if (typeof obj[key] !== 'function') {
	  return true;
	}
  }
  return false;
}

// Write a data object to a dw.io.XMLIndentingStreamWriter object

function writeObjectToXML(XMLISWriter, object) {
  for (var property in object) {
    var value = object[property];
    property = camelCase(property);
    if(value == null) {
//    Skip it!
      continue;
    }
    if (Array.isArray(value)) { // Current element is an array of objects that must be written separately
      var elements = property.substring(0, property.length - 1);
      if(value.length==0){
        XMLISWriter.writeEmptyElement(property);
      }else{
        XMLISWriter.writeStartElement(property);
//      See below for the definition of the writeArrayToXML() function
        writeArrayToXML(XMLISWriter, elements, value);
        XMLISWriter.writeEndElement();
      }
    } else if (typeof value === 'object') { // Current element is an object
      var type = Object.prototype.toString.call(value);
      type = parseType(type);
      if (type === 'Date') { // Current element is a date field
        singleElement(XMLISWriter, property, value);
      } else { // Current element is an object other than a date field
        var keys = Object.keys(value);
        if (keys.length == 0) {
          XMLISWriter.writeEmptyElement(property);
          continue;
        }
        if(!hasProperties(value)) {
          singleElement(XMLISWriter, property, value);
          continue;
        }
        XMLISWriter.writeStartElement(property);
        writeObjectToXML(XMLISWriter, value);
        XMLISWriter.writeEndElement();
       
      }
    } else if (typeof value !== 'function') { // Current element is anything else; skip anything that looks like a function
      singleElement(XMLISWriter, property, value);
    }
  }
}

// Write an array of data objects to a dw.io.XMLIndentingStreamWriter object

function writeArrayToXML(XMLISWriter, element, objects) {
  for (var i = 0; i < objects.length; i++) {
    XMLISWriter.writeStartElement(element);
    writeObjectToXML(XMLISWriter, objects[i]);
    XMLISWriter.writeEndElement();
  }
}
exports.writeArrayToXML = writeArrayToXML;