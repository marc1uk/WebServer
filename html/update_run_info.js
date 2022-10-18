"use strict";

import { getDataFetchRequest } from './update_traces.js';

// function that takes the name of a plot and pulls the data and updates it.
async function GetRunStatus(){
	
	// send off a fetch request for the data
	let datapromise = getDataFetchRequest("http://133.11.177.165/cgi-bin/marcus/get_run_info.cgi", "text");
	
	// register callback that will update the webpage based on the data once it arrives
	datapromise.then(UpdateRunInfo);
	
}

async function UpdateRunInfo(response){
	
	// response should be a JSON map of properties
	// loop over them and update the corresponding elements
	
	// parse the json
	let jsonstring = JSON.stringify(response);
	let runobject = JSON.parse(jsonstring);
	if(typeof runobject==='string') runobject = JSON.parse(runobject);
	
	// loop over properties
	for(const akey in runobject){
		// stupid check to reject prototype properties
		if(runobject.hasOwnProperty(akey)==false) continue;
		let aval = runobject[akey];
		let HTMLDIV = document.getElementById(akey);
		
		if(akey=="notes"){
			let notes=aval.trim();                                  // trim whitespace
			const lines = (notes.match(/\n/g) || '').length + 1;    // count lines
			HTMLDIV.innerHTML=notes;                                // fill content
			HTMLDIV.rows = lines;                                   // resize box to show the notes
		} else {
			HTMLDIV.value = aval;
		}
	}
	
}

document.addEventListener("DOMContentLoaded", function(){
	// an initial trigger
	GetRunStatus();
	// set a timer to update the data every second
	var timerHandle = setInterval(GetRunStatus, 3000);
});
