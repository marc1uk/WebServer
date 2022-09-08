"use strict";
// NOTE: MANY CHANGES TO THESE SCRIPTS REQUIRE A FORCED FULL RELOAD (SHIFT+F5)

// these may be overridden if we pull in another script first
// (another <script src="..."> line) that defines a function
// of the same name
// we could also split common functions out into a standalone file
// and import the definitions with:
import { getDataFetchRequest } from './update_traces.js';
import { compareTimestamp } from './update_traces.js';
import { config } from './update_traces.js';
import { parseTrace } from './update_traces.js';

// define plot layout
const layout4= {
	autosize: true,
	xaxis: {
		autorange:  true,  // auto-range by default
		// note user interaction will set this to false, but we should re-set it to true on updates
		
		// setting uirevision='true' allows retaining zoom level between redraws / refreshes.
		uirevision: true,
		
		// set the title
		title: { text: 'Time' },
		
		// add buttons for discrete time ranges
		rangeselector: {
			buttons: [
				{
					count: 1,
					label: '1hr',
					step: 'hour',
					stepmode: 'backward'
				},
				{
					count: 3,
					label: '3hr',
					step: 'hour',
					stepmode: 'backward'
				},
				{
					count: 6,
					label: '6hr',
					step: 'hour',
					stepmode: 'backward'
				},
				{
					count: 12,
					label: '12h',
					step: 'hour',
					stepmode: 'backward'
				},
				{
					count: 24,
					label: '24hr',
					step: 'hour',
					stepmode: 'backward'
				},
				{
					count: 3,
					label: '3d',
					step: 'day',
					stepmode: 'backward'
				},
				{
					count: 7,
					label: '1w',
					step: 'day',
					stepmode: 'backward'
				},
				{
					count: 1,
					label: '1m',
					step: 'month',
					stepmode: 'backward'
				},
				
				{step: 'all'}
				
			]
		}
		
		// to reset changes to the ui view (and restore auto-range), set layout.uirevision to
		// a different numeric value than before (e.g. call `layout.uirevision = Math.random();`)
	},
	yaxis: {
		autorange: true,
		//rangemode: 'nonnegative',  // some parameter values may be negative...
		uirevision: true,
		title: {
			text: 'Relative Transparency (to pure water)'
		},
	},
	//width: 800,
	//height: 500,
	margin: {
		b: 80,
		t: 0,
		r: 5
	},
}

// function that takes the name of a plot and pulls the data and updates it.
async function GetTraces(name){
//	console.log("Plotting new data for trace ",name);
	
	let urls = undefined;
	
	if(name=="transparency_samples"){
		// mean, width
		urls = new Map([["red", "http://192.168.2.54/cgi-bin/marcus/get_measurement_values.cgi?a=transparency&d=red"],
		                ["green","http://192.168.2.54/cgi-bin/marcus/get_measurement_values.cgi?a=transparency&d=green"],
		                ["blue","http://192.168.2.54/cgi-bin/marcus/get_measurement_values.cgi?a=transparency&d=blue"]]);
	}
	
	if(name=="transparency_heatmap"){
		// mean, width
		urls = new Map([["heatmap","http://192.168.2.54/cgi-bin/marcus/get_measurement_values.cgi?a=transparency_heatmap"]]);
	}
	
	//console.log("GetTraces got ",urls.size," urls for name ",name);
	
	if(urls.size==0){
		console.log("GetTraces matched no cases for name ",name);
		return urls;
	}
	
	// spin off a bunch of fetch requests and build an array of promises to the data
	let datapromises = new Map();
	for(const akey of urls.keys()){
		//console.log("getting data promise for url ",urls.get(akey));
		datapromises.set(akey, getDataFetchRequest(urls.get(akey), "json"));
	}
	
	let traces = []; // traces is an array, NOT a map.
	// send those promises off to a bunch of parser instances that will parse the data when it comes in
	// parseTrace will return a trace object that we can push into the traces array
	for(const akey of datapromises.keys()){
		traces.push( await parseTrace(datapromises.get(akey), akey));
	}
	
	//console.log("GetTraces got ",traces.length," traces for name ",name);
	//console.log("GetTraces for ",name," returning: ",traces);
	
	return traces;
	
}

async function UpdateHeatmap(name){
	
	let tracepromise = GetTraces(name);
	//console.log("trace promise for name ",name," is ",tracepromise);
	
	// we need to await the result before we can work with it.
	// yes, we await within GetTraces, but that just means traces will return a promise
	// before GetTraces 'returns' a value. (since GetTraces is async)
	let traces = await tracepromise;
	//console.log("awaited traces for name ",name," is ",traces);
	
	if(traces.length == 0){
		console.log("No traces returned for ",name);
		return;
	}
	
	//console.log("UpdateHeatmap for name ",name," had ",traces.length," traces");
	//console.log("UpdateHeatmap for ",name," traces[0] is ",traces[0]);
	
	// set plot type to heatmap
	if(name=="transparency_heatmap"){
		traces[0]['type'] = 'heatmap';
		traces[0]['showscale'] = true;
	} else {
		for(let i=0; i<traces.length; ++i){
			traces[i]['type'] = 'scatter';
			traces[i]['mode'] = 'lines+markers';
		}
	}
	
	// add a rangeslider to the correct range
	let startTime = traces[0]['x'][0];
	let endTime = traces[0]['x'][traces[0]['x'].length-2];
	layout4.xaxis['rangeslider'] = {range: [startTime, endTime] };
	
	// tell plotly the data has changed
	layout4.datarevision = Math.random();
	
	// get the div element to insert plot into
	let HTMLDIV = document.getElementById(name);
	
	// update the plot
	Plotly.react(HTMLDIV, traces, layout4, config);
	
}

// retrieve new data and update the plot
function check_for_new_data3(name) {
	
	let getTimeUrl = "http://192.168.2.54/cgi-bin/marcus/get_last_trace_time.cgi";
	//console.log("checking for new data for ",name," at ",getTimeUrl);
	
	try {
		// get the timestamp of when the data was last updated
		let newdataavailable = getDataFetchRequest(getTimeUrl).then(
			function(latest_timestamp){
				//console.log("timeUrl returned ",latest_timestamp," seeing if it's new");
				return compareTimestamp(name, latest_timestamp);
			},
			function(error){
				console.log("timeUrl returned an error: ",error);
				return false;
			}
		);
		
		// when that returns...
		newdataavailable.then(
			function(result){
				//console.log("compareTimestamp promise returned with result ",result);
				// check if there was new data available
				if(result == true){
					// retrieve and plot new data
					//console.log("new data for ",name);
					UpdateHeatmap(name);
				}  // else no need to update plot
			}
			// no need to register a rejection handler; newdataavailable should always resolve
		);
	} catch(error){
		console.log(error);
	};
	
}


//==============//
// main routine 
//==============//

// on load, find all plots and register a timer that periodically updates it
var timerHandleMap = {};
document.addEventListener("DOMContentLoaded", function(){
	
	// get transparency plots
	const plots = document.getElementsByClassName("transparencyplot");
	
	// register event to update it when shown
	for(let i = 0; i < plots.length; i++) {
		
		let plotdiv = plots[i];
		let parentdiv = plotdiv.parentNode;
		console.log("registering event for plot ",plotdiv.id," with parent ",parentdiv.id);
		
		// add events for when a plot is shown from the accordian
		parentdiv.addEventListener("shown.bs.collapse", function(){
			//console.log("registering for periodic updates")
			var handle = setInterval(function(){check_for_new_data3(plotdiv.id) }, 3000);
			timerHandleMap[plotdiv.id] = handle;
			//check_for_new_data3(plotdiv.id);
			Plotly.relayout(plotdiv, {autosize: true});
		});
		
		// add event to collapse to disable updates while the plot is not shown
		parentdiv.addEventListener("hidden.bs.collapse", function(){
			if(timerHandleMap[plotdiv.id] != null){
				//console.log("clearing interval ",timerHandleMap[plotdiv.id]);
				clearInterval(timerHandleMap[plotdiv.id]);
				timerHandleMap[plotdiv.id]=null;
			}
		});
		
	}
	
	// finally add period updates to the initially open traces
	var handle = setInterval(function(){ check_for_new_data3('transparency_samples') }, 3000);
	timerHandleMap['transparency_samples'] = handle;
	
});

