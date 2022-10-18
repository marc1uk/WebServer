"use strict";
// NOTE: MANY CHANGES TO THESE SCRIPTS REQUIRE A FORCED FULL RELOAD (SHIFT+F5)

// these may be overridden if we pull in another script first
// (another <script src="..."> line) that defines a function
// of the same name
// we could also split common functions out into a standalone file
// and import the definitions with:
// import { getDataFetchRequest } from './last_trace.js';
// not sure if that works with constants, though...

export { getDataFetchRequest };
export { compareTimestamp };
export { config };
export { parseTrace };

// a general asynchronous getter for fetching data from a url
async function getDataFetchRequest(url, json_or_text="text"){
	//console.log("get_pure_trace::getDataFetchRequest(",url,")");
	try {
		let response = await fetch(url);
		let thetext = "";
		if(json_or_text=="json"){
			thetext = await response.text();
		} else {
			thetext = await response.json();
		}
		return thetext;
	} catch (err) {
		console.log("Failed to get data from "+url, err);
		return null;
	}
}

// define plot layout
const layout=  {
	autosize: true,
	xaxis: {
		autorange:  true,  // auto-range by default
		// note user interaction will set this to false, but we should re-set it to true on updates
		
		//type: 'date',    // for date axes
		
		// setting uirevision='true' allows retaining zoom level between redraws / refreshes.
		uirevision: true,
		
		title: {
			text: 'wavelength [nm]'
		}
		
		// to reset changes to the ui view (and restore auto-range), set layout.uirevision to
		// a different numeric value than before (e.g. call `layout.uirevision = Math.random();`)
		
		// add a range scrubber beneath the plot
		//rangeslider: {range: [wavelengths[0], wavelengths[wavelengths.length-2]] }  // why -2?
	},
	yaxis: {
		fixedrange: false,
		autorange: true,
		rangemode: 'nonnegative',  // absorbance graph goes negative outside ROI
		uirevision: true,
		title: {
			text: 'Intensity [ADC counts]'
		},
	},
	//width: 800,
	//height: 500,
	margin: {
		b: 80,
		t: 0,
		l: 80,
		r: 5
	},
	/*modebar: {
		orientation: 'v'
	}
	*/
	//plot_bgcolor:"black",
	//paper_bgcolor:"#FFF3"
}

// define configuration options for how the plot should embed itself in the webpage
// setting responsive true means the plot will scale with resizing of the container div.
// this results in weird oscillating sizes when plots are put into an accordian, so disable it
const config = {responsive: false}

var toType = function(obj) {
  return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase()
}


// a function for parsing a json data string into a Plotly trace
async function parseTrace(theData, theName){
	
	// since we make this function async, but stringify is presumably not async(?) so requires real data
	// (not a promise to data), we need to wait for the data to come in before we start parsing.
	theData = await theData;
	//console.log("parseTrace json string for ",theName," is ",theData);
	
	// split data
	let jsonstring = JSON.stringify(theData);
	let dataarray = JSON.parse(jsonstring);
	// apparently this can fail to parse "over-stringified" strings.
	// but we previously had issues when we DIDN'T stringify the data.
	// so we may need to parse it twice??? ffs....
	//if(theName=='rawfit_pars'){ console.log("going to attempt to parse rawfit dataarray: '",dataarray,"'"); }
	if(theName=='rawfit_pars') console.log(theName," dataarray is '",dataarray,"'");
	if(typeof dataarray==='string') dataarray = JSON.parse(dataarray);
	let xvals = dataarray['xvals'];
	let yvals = dataarray['yvals'];
	if(xvals == undefined){
		console.log("undefined x val array parsed for ",name," from ",jsonstring);
	}
	
	let thistrace = {
		x: xvals,
		y: yvals,
		name: theName
	};
	
	if(dataarray['xerrs'] != null){ thistrace['error_x'] = dataarray['xerrs']; }
	if(dataarray['yerrs'] != null){ thistrace['error_y'] = dataarray['yerrs']; }
	if(dataarray['zvals'] != null){ thistrace['z'] = dataarray['zvals']; }
	
	return thistrace;
}

// compare last data change time with last draw time
// it maintains a map of timestamps as members of the functor
// so we can track the last update time of many traces
function compareTimestamp(name, timestamp){
	// make an entry if there isn't one (cover case of first draw)
	if (!('lastupdatetime' in compareTimestamp)){
		compareTimestamp.lastupdatetime = [];
	}
	
	if(compareTimestamp.lastupdatetime[name] != timestamp){
		// time for an update
		compareTimestamp.lastupdatetime[name] = timestamp;
		//console.log("new timestamp for ",name,", new val: ",timestamp,
		//            ", last recorded: ",compareTimestamp.lastupdatetime[name]);
		return true;
		
	} else {
		// don't bother updating the plot, no new data.
		return false;
	}
}

// function that takes the name of a plot and pulls the data and updates it.
async function UpdatePlot(name){
	//console.log("Plotting new data for trace ",name);
	
	let traces = [];
	
	if(name=="dark_subtracted_data"){
		// we'll overlay several traces on this plot - the dark subtracted trace,
		// split into the sideband (fitted) region and the in-band (absorption) region
		let intraceUrl = "http://192.168.2.54/cgi-bin/marcus/get_latest_trace.cgi?a=dark_subtracted_data_in";
		let outtraceUrl = "http://192.168.2.54/cgi-bin/marcus/get_latest_trace.cgi?a=dark_subtracted_data_out";
		// we'll also overlay the original pure, and the result of the pure fitted to the data
		let pureTraceUrl = "http://192.168.2.54/cgi-bin/marcus/get_latest_trace.cgi?a=dark_subtracted_pure";
		let pureFittedUrl = "http://192.168.2.54/cgi-bin/marcus/get_latest_trace.cgi?a=pure_scaled";
		// fetch tha data for all traces in parallel
		let intracedata_promise = getDataFetchRequest(intraceUrl, "json");
		let outtracedata_promise = getDataFetchRequest(outtraceUrl, "json");
		let puretracedata_promise = getDataFetchRequest(pureTraceUrl, "json");
		let purefitteddata_promise = getDataFetchRequest(pureFittedUrl, "json");
		
		// parse the arrays and build traces
		let intrace_promise = parseTrace(intracedata_promise, 'dark_subtracted_data_in');
		let outtrace_promise = parseTrace(outtracedata_promise, 'dark_subtracted_data_out');
		let puretrace_promise = parseTrace(puretracedata_promise, 'pure_reference');
		let purefitted_promise = parseTrace(purefitteddata_promise, 'pure_fitted');
		
		// wait for the promises of data to be fulfilled
		let intrace = await intrace_promise;
		let outtrace = await outtrace_promise;
		let puretrace = await puretrace_promise;
		let purescaledtrace = await purefitted_promise;
//		console.log("outtrace is ",outtrace);
//		console.log("outtrace.x is ",outtrace.x);
		
		// to make a 'gap' between the data in the sideband region plot
		// so that it doesn't draw a connecting line over the absorption region
		// we can add an 'NA' value to the data arrays (ensure 'connect gaps' is off =default)
		let insertindex=0;
		for(let i=0; i<outtrace.x.length; ++i){
			if(outtrace.x[i]>275){
				insertindex=i;
				break;
			}
		}
		outtrace.x.splice(insertindex, 0, 275);
		outtrace.y.splice(insertindex, 0, 'NA');
		
		traces = [ intrace, outtrace, puretrace, purescaledtrace ];
	} else {
		//console.log("getting plot data for trace ",name);
		let dataUrl = "http://192.168.2.54/cgi-bin/marcus/get_latest_trace.cgi?a=" + name;
		let newdata_promise = getDataFetchRequest(dataUrl, "json");
		//console.log("building traces from data ",newdata);
		traces = [ await parseTrace(newdata_promise, name) ];
	}
	
	for(let i=0; i<traces.length; i++){
		traces[i]['type'] = 'scatter';
		if(traces[i]['name'] == 'pure_fitted') traces[i]['mode'] = 'lines';
		else traces[i]['mode'] = 'lines+markers';
	}
	
	// tell plotly the data has changed
	layout.datarevision = Math.random();
	
	// get the div element to insert plot into
	let HTMLDIV = document.getElementById(name);
	
	// update the plot
	Plotly.react(HTMLDIV, traces, layout, config);
	// trigger resizing to the containing div.
	//Plotly.relayout(HTMLDIV, {autosize: true});
	
}

// retrieve new data and update the plot
function check_for_new_data(name) {
	console.log("checking for new data for ",name);
	let getTimeUrl = "http://192.168.2.54/cgi-bin/marcus/get_last_trace_time.cgi?a=" + name;
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
					console.log("new data available for",name);
					UpdatePlot(name);
				}  else {
					// else no need to update plot
					console.log("new data available for",name);
				}
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
	const plots = document.getElementsByClassName("dataplot");
	
	// do an initial retrieval of all plot data FIXME sensible? or slow?
	//for(let i = 0; i < plots.length; i++) {
	//	check_for_new_data(plots[i].id);
	//}
	
	// register events
	for(let i = 0; i < plots.length; i++) {
		
		let plotdiv = plots[i];
		let parentdiv = plotdiv.parentNode;
		
		// add events for when a plot is shown from the accordian
		parentdiv.addEventListener("shown.bs.collapse", function(){
			if(timerHandleMap[plotdiv.id] != null) return;
			console.log("registering ",plotdiv.id," for periodic updates");
			var handle = setInterval(function(){ check_for_new_data(plotdiv.id) }, 20000);
			timerHandleMap[plotdiv.id] = handle;

			// trigger it for the first time
			check_for_new_data(plotdiv.id);
			
			if(plotdiv.id=="dark_subtracted_data" ){
				// an initial zoom to region of interest
				layout.xaxis.autorange = false;
				layout.xaxis.range=[250, 310];
			} else {
				layout.xaxis.autorange = true;
			}
			layout.yaxis.autorange = true;
			// tell plotly the ui has changed
			layout.uirevision = Math.random();
			
			// resize plot to fit the div. We need to manually trigger a resize
			// on show, because plotly doesn't know the size of the containing
			// div until it is expanded. However, we can't do it here (immediately)
			// as the plot is generated asynchronously once data comes back,
			// and Plotly will fall over entirely if the plot doesn't yet exist.
			// so instead we trigger a resize on each data update (in plotData)
			//console.log("updating layout for div ",plotdiv);
			Plotly.relayout(plotdiv, {autosize: true});
			
		});
		
		// add event to collapse to disable updates while the plot is not shown
		parentdiv.addEventListener("hidden.bs.collapse", function(){
			if(timerHandleMap[plotdiv.id] != null){
				console.log("clearing interval for ",plotdiv.id);
				clearInterval(timerHandleMap[plotdiv.id]);
				timerHandleMap[plotdiv.id]=null;
			}
		});
		
	}
	
	// finally add period updates to the initially open trace
	var handle = setInterval(function(){ check_for_new_data('last_trace') }, 20000);
	timerHandleMap['last_trace'] = handle;
});

