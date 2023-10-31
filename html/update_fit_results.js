"use strict";

import { getDataFetchRequest } from './update_traces.js';

// function that takes the name of a plot and pulls the data and updates it.
async function GetFitStatus(){
	
	// send off a fetch request for the data
	let datapromise = getDataFetchRequest("http://192.168.2.54/cgi-bin/marcus/get_fit_results.cgi", "text");
	
	// register callback that will update the webpage based on the data once it arrives
	datapromise.then(UpdateFitInfo);
	
}

async function UpdateFitInfo(response){
	
	// response should be a JSON map of properties
	// loop over them and update the corresponding elements
	
	// parse the json
	let jsonstring = JSON.stringify(response);
	let fitobject = JSON.parse(jsonstring);
	if(typeof fitobject==='string') fitobject = JSON.parse(fitobject);

	// loop over properties
	for(const akey in fitobject){
		// stupid check to reject prototype properties
		if(fitobject.hasOwnProperty(akey)==false) continue;
		let aval = fitobject[akey];
		
		if(akey=="purefit"){
			let HTMLDIV = document.getElementById(akey);
			if(aval==1){
				HTMLDIV.value="Success";
				HTMLDIV.classList.remove('text-danger');
				HTMLDIV.classList.remove('text-warning');
				HTMLDIV.classList.add('text-success');
			} else if(aval==0){
				HTMLDIV.value="Failed";
				HTMLDIV.classList.add('text-danger');
				HTMLDIV.classList.remove('text-success');
				HTMLDIV.classList.remove('text-warning');
			} else {
				HTMLDIV.value="Unknown";
				HTMLDIV.classList.remove('text-danger');
				HTMLDIV.classList.remove('text-success');
				HTMLDIV.classList.add('text-warning');
			}
		} else if(akey=="fits"){
			// aval is an array of json objects, one per fit method
			for(let i=0; i<aval.length; ++i){
				let afit = aval[i];
				// each method is a json object with properties; 'method', 'absfit', 'peakdiff' and 'gdconc'
				let themethod = afit.method;
				let theabsfitstatus = afit.absfit;
				let thepeakdiff = afit.peakdiff;
				let thegdconc = afit.gdconc;
				
				// update the respective page elements
				
				// absorption fit status
				let HTMLDIV = document.getElementById('absfitstat_' + themethod);
				if(theabsfitstatus==1){
					HTMLDIV.value="Success";
					HTMLDIV.classList.remove('text-danger');
					HTMLDIV.classList.remove('text-warning');
					HTMLDIV.classList.add('text-success');
				} else if(theabsfitstatus==0){
					HTMLDIV.value="Failed";
					HTMLDIV.classList.add('text-danger');
					HTMLDIV.classList.remove('text-success');
					HTMLDIV.classList.remove('text-warning');
				} else {
					HTMLDIV.value="Unknown";
					HTMLDIV.classList.remove('text-danger');
					HTMLDIV.classList.remove('text-success');
					HTMLDIV.classList.add('text-warning');
				}
				
				// peak difference
				HTMLDIV = document.getElementById('peakdiff_' + themethod);
				HTMLDIV.value = thepeakdiff;
				
				// gd conc
				HTMLDIV = document.getElementById('gdconc_' + themethod);
				HTMLDIV.value = thegdconc;
			}
		} else {
			console.log("Uknown property in UpdateFitInfo: ",akey);
		}
	}
	
}

document.addEventListener("DOMContentLoaded", function(){
	// an initial trigger
	GetFitStatus();
	// set a timer to update the data every second
	var timerHandle = setInterval(GetFitStatus, 30000);
});
