'use strict';

function formatCalendar(calendar , format) {
   var formattedString = calendar  + format;	
	return formattedString;	
}

module.exports = {
    formatCalendar: formatCalendar
};
