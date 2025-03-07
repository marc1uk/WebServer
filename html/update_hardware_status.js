"use strict";

import { getDataFetchRequest } from './update_traces.js';


// function that takes the name of a plot and pulls the data and updates it.
async function GetHardwareStatus(){
	
	let urls = undefined;
	
	urls = new Map([["power", "/cgi-bin/marcus/get_power_state.cgi"],
	                ["pump", "/cgi-bin/marcus/get_pump_state.cgi"],
	                ["invalve", "/cgi-bin/marcus/get_valve_state.cgi?&a=inlet"],
	                ["outvalve", "/cgi-bin/marcus/get_valve_state.cgi?&a=outlet"],
	                ["pwmboard", "/cgi-bin/marcus/get_pwmboard_state.cgi"],
	                ["spectrometer", "/cgi-bin/marcus/get_spectrometer_state.cgi"],
	                ["ledswitches", "/cgi-bin/marcus/get_led_states.cgi"]]);
	
	// spin off a bunch of fetch requests and build an array of promises to the data
	let datapromises = new Map();
	for(const akey of urls.keys()){
		//console.log("getting data promise for url ",urls.get(akey));
		datapromises.set(akey, getDataFetchRequest(urls.get(akey), "text"));
	}
	
	// call handlers that will update the webpage based on the data as it arrives
	for(const akey of datapromises.keys()){
		UpdateHWInfo(akey, datapromises.get(akey));
	}
	
}

async function UpdateHWInfo(name, responsepromise){
	
	// need to wait for the reponse to come in before we can handle it
	let response = await responsepromise;
	if(name=="power" || name=="pump" || name=="invalve" || name=="outvalve"){
		let HTMLDIV = document.getElementById(name);
		HTMLDIV.value=response;
		if(response=="ON" || response=="OPEN" || response=="ONLINE"){
			HTMLDIV.classList.remove('btn-danger');
			HTMLDIV.classList.remove('btn-warning');
			HTMLDIV.classList.add('btn-success');
			HTMLDIV.classList.add('active');
		} else if(response=="OFF" || response=="CLOSED" || response=="OFFLINE"){
			HTMLDIV.classList.remove('btn-warning');
			HTMLDIV.classList.remove('btn-success');
			HTMLDIV.classList.remove('active');
			HTMLDIV.classList.add('btn-danger');
		} else {
			HTMLDIV.classList.remove('btn-danger');
			HTMLDIV.classList.remove('btn-success');
			HTMLDIV.classList.remove('active');
			HTMLDIV.classList.add('btn-warning');
		}
	}
	
	if(name=="pwmboard" || name=="spectrometer"){
		let HTMLDIV = document.getElementById(name);
		if(response=="ONLINE"){
			HTMLDIV.checked = true;
			HTMLDIV.indeterminate = false;
		} else if(response=="OFFLINE"){
			HTMLDIV.checked = false;
			HTMLDIV.indeterminate = false;
		} else {
			HTMLDIV.indeterminate = true;
		}
	}
	
	if(name=="ledswitches"){
		
		// parse the json array of states
		let jsonstring = JSON.stringify(response);
		let statusarray = JSON.parse(jsonstring);
		if(typeof statusarray==='string') statusarray = JSON.parse(statusarray);

		for(let i = 0; i < statusarray.length; i++) {
			let nextled = statusarray[i];
			let HTMLDIV = document.getElementById(nextled.name);
			if(nextled.state==0){
				HTMLDIV.checked = false;
				HTMLDIV.indeterminate = false;
			} else if(nextled.state==1){
				HTMLDIV.checked = true;
				HTMLDIV.indeterminate = false;
			} else {
				HTMLDIV.indeterminate = true;
			}
		}
	}
	
}

document.addEventListener("DOMContentLoaded", function(){
	// an initial trigger
	GetHardwareStatus();
	// set a timer to update the data every second
	var timerHandle = setInterval(GetHardwareStatus, 30000);
});
