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
		console.log("getDataFetchRequest fetching ",url," and waiting on response");
		let response = await fetch(url);
		console.log("getDataFetchRequest received response for ",url);
		let thetext = "";
		if(json_or_text=="json"){
			console.log("getDataFetchRequest awaiting on conversion to text for ",url);
			thetext = await response.text();
		} else {
			console.log("getDataFetchRequest awaiting on conversion to json for ",url);
			thetext = await response.json();
		}
		console.log("getDataFetchRequest returning ",url," conversion result"); //,thetext);
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
	console.log("compareTimestamp checking timestamp for ",name);
	console.log("new timestamp is ",timestamp);
	// make an entry if there isn't one (cover case of first draw)
	if (!('lastupdatetime' in compareTimestamp)){
		compareTimestamp.lastupdatetime = [];
	}
	
	if(compareTimestamp.lastupdatetime[name] != timestamp){
		console.log("compareTimestamp got updated timestamp for ",name);
		// time for an update
		compareTimestamp.lastupdatetime[name] = timestamp;
		//console.log("new timestamp for ",name,", new val: ",timestamp,
		//            ", last recorded: ",compareTimestamp.lastupdatetime[name]);
		return true;
		
	} else {
		console.log("compareTimestamp no need to update ",name);
		// don't bother updating the plot, no new data.
		return false;
	}
}

// function that takes the name of a plot and pulls the data and updates it.
async function UpdatePlot(name){
	console.log("UpdatePlot called for plot ",name);
	
	let traces = [];
	
	if(name=="dark_subtracted_data"){
		// we'll overlay several traces on this plot - the dark subtracted trace,
		// split into the sideband (fitted) region and the in-band (absorption) region
		let intraceUrl = "/cgi-bin/marcus/get_latest_trace.cgi?a=dark_subtracted_data_in";
		let outtraceUrl = "/cgi-bin/marcus/get_latest_trace.cgi?a=dark_subtracted_data_out";
		// we'll also overlay the original pure, and the result of the pure fitted to the data
		let pureTraceUrl = "/cgi-bin/marcus/get_latest_trace.cgi?a=dark_subtracted_pure";
		let pureFittedUrl = "/cgi-bin/marcus/get_latest_trace.cgi?a=pure_scaled";
		// fetch tha data for all traces in parallel
		console.log("UpdatePlot submitting 4 fetch requests for dark sub traces.");
		console.log(name," fetch 1");
		let intracedata_promise = getDataFetchRequest(intraceUrl, "json");
		console.log(name," fetch 2");
		let outtracedata_promise = getDataFetchRequest(outtraceUrl, "json");
		console.log(name," fetch 3");
		let puretracedata_promise = getDataFetchRequest(pureTraceUrl, "json");
		console.log(name," fetch 4");
		let purefitteddata_promise = getDataFetchRequest(pureFittedUrl, "json");
		
		// parse the arrays and build traces
		console.log("UpdatePlot calling parseTrace for 4 trace arrays.");
		console.log(name," callparse 1");
		let intrace_promise = parseTrace(intracedata_promise, 'dark_subtracted_data_in');
		console.log(name," callparse 2");
		let outtrace_promise = parseTrace(outtracedata_promise, 'dark_subtracted_data_out');
		console.log(name," callparse 3");
		let puretrace_promise = parseTrace(puretracedata_promise, 'pure_reference');
		console.log(name," callparse 4");
		let purefitted_promise = parseTrace(purefitteddata_promise, 'pure_fitted');
		
		// wait for the promises of data to be fulfilled
		console.log("UpdatePlot waiting for 4 trace promises to be fulfilled for ",name);
		console.log(name," await 1");
		let intrace = await intrace_promise;
		console.log(name," await 2");
		let outtrace = await outtrace_promise;
		console.log(name," await 3");
		let puretrace = await puretrace_promise;
		console.log(name," await 4");
		let purescaledtrace = await purefitted_promise;
//		console.log("outtrace is ",outtrace);
//		console.log("outtrace.x is ",outtrace.x);
		
		// to make a 'gap' between the data in the sideband region plot
		// so that it doesn't draw a connecting line over the absorption region
		// we can add an 'NA' value to the data arrays (ensure 'connect gaps' is off =default)
		let insertindex=0;
		console.log("cutting out absorption region for ",name);
		for(let i=0; i<outtrace.x.length; ++i){
			if(outtrace.x[i]>275){
				insertindex=i;
				break;
			}
		}
		console.log("splicing ",name);
		outtrace.x.splice(insertindex, 0, 275);
		outtrace.y.splice(insertindex, 0, 'NA');
		
		traces = [ intrace, outtrace, puretrace, purescaledtrace ];
	} else if(name=="absorbance_trace"){
	
		// overlay data and fit
		let dataUrl = "/cgi-bin/marcus/get_latest_trace.cgi?a=absorbance_trace";
		let fitUrl = "/cgi-bin/marcus/get_latest_trace.cgi?a=absfit";
		// fetch tha data for the two traces in parallel
		console.log("UpdatePlot submitting 2 fetch requests for absorbance traces.");
		console.log(name," fetch 1");
		let rawdata_promise = getDataFetchRequest(dataUrl, "json");
		console.log(name," fetch 2");
		let fitdata_promise = getDataFetchRequest(fitUrl, "json");
		
		// parse the arrays and build traces
		console.log("UpdatePlot calling parseTrace for 2 trace arrays.");
		console.log(name," callparse 1");
		let raw_promise = parseTrace(rawdata_promise, 'absorbance_data');
		console.log(name," callparse 2");
		let fit_promise = parseTrace(fitdata_promise, 'absorbance_fit');
		
		// wait for the promises of data to be fulfilled
		console.log("UpdatePlot waiting for 2 trace promises to be fulfilled for ",name);
		console.log(name," await 1");
		let datatrace = await raw_promise;
		console.log(name," await 2");
		let fittrace = await fit_promise;
		
		// plot thw two traces
		traces = [ datatrace, fittrace ];
		
	} else {
		console.log("UpdatePlot submitting fetch request for trace data ",name);
		let dataUrl = "/cgi-bin/marcus/get_latest_trace.cgi?a=" + name;
		let newdata_promise = getDataFetchRequest(dataUrl, "json");
		console.log("UpdatePlot awaiting parsetrace for ",name);
		//console.log("building traces from data ",newdata);
		traces = [ await parseTrace(newdata_promise, name) ];
		console.log("UpdatePlot got traces for ",name);
	}
	
	console.log("UpdateTraces setting trace properties for ",name);
	for(let i=0; i<traces.length; i++){
		traces[i]['type'] = 'scatter';
		if(traces[i]['name'] == 'pure_fitted') traces[i]['mode'] = 'lines';
		else if (traces[i]['name'] == 'pure_reference') traces[i]['visible'] = 'legendonly';
		else if (traces[i]['name'] == 'absorbance_fit') traces[i]['mode'] = 'lines';
		else traces[i]['mode'] = 'lines+markers';
	}
	
	// tell plotly the data has changed
	layout.datarevision = Math.random();
	
	// get the div element to insert plot into
	let HTMLDIV = document.getElementById(name);
	
	// update the plot
	console.log("UpdateTraces reacting plot ",name);
	Plotly.react(HTMLDIV, traces, layout, config);
	console.log("UpdateTraces finished ",name);
	// trigger resizing to the containing div.
	//Plotly.relayout(HTMLDIV, {autosize: true});
	
}

// retrieve new data and update the plot
function check_for_new_data(name) {
	console.log("check_for_new_data called for ",name);
	let getTimeUrl = "";
	if(name=="dark_subtracted_data"){
		getTimeUrl = "/cgi-bin/marcus/get_last_trace_time.cgi?a=dark_subtracted_data_in";
	} else {
		getTimeUrl = "/cgi-bin/marcus/get_last_trace_time.cgi?a=" + name;
	}
	//console.log("checking for new data for ",name," at ",getTimeUrl);
	
	try {
		// get the timestamp of when the data was last updated
		console.log("check_for_new_data submitting getDataFetchRequest for last updated timestamp for ",name);
		let newdataavailable = getDataFetchRequest(getTimeUrl).then(
			function(latest_timestamp){
				console.log("check_for_new_data returned last update timestamp ",latest_timestamp,
				            " for ",name,", seeing if it's new");
				return compareTimestamp(name, latest_timestamp);
			},
			function(error){
				console.log("check_for_new_data returned an error waiting on timestamp for ",name,
				            ": ",error);
				return false;
			}
		);
		
		// when that returns...
		console.log("check_for_new_data waiting for timestamp comparison check for ",name);
		newdataavailable.then(
			function(result){
				console.log("check_for_new_data returned timestamp is new: ",result);
				// check if there was new data available
				if(result == true){
					// retrieve and plot new data
					console.log("check_for_new_data has new data available for",name,", updating plot");
					UpdatePlot(name);
				}  else {
					// else no need to update plot
					console.log("check_for_new_data no new data available for",name);
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
	console.log("update_traces initialising");
	const plots = document.getElementsByClassName("dataplot");
	
	// do an initial retrieval of all plot data FIXME sensible? or slow?
	//for(let i = 0; i < plots.length; i++) {
	//	check_for_new_data(plots[i].id);
	//}
	
	// register events
	for(let i = 0; i < plots.length; i++) {
		
		let plotdiv = plots[i];
		let parentdiv = plotdiv.parentNode;
		
		Plotly.newPlot(plotdiv, [], layout, config);
		
		// add events for when a plot is shown from the accordian
		parentdiv.addEventListener("shown.bs.collapse", function(){
			console.log("registering ",plotdiv.id," for periodic updates");
			/*
			console.log("current contents are: [");
			for(var prop in timerHandleMap){
				console.log("'",prop,"'->'",timerHandleMap[prop],"'", );
			}
			console.log("]");
			*/
			
			if(timerHandleMap[plotdiv.id] != null) return;
			var handle = setInterval(function(){ check_for_new_data(plotdiv.id) }, 300); //30000
			timerHandleMap[plotdiv.id] = handle;
			
			/*
			console.log("contents after insertion are: [");
			for(var prop in timerHandleMap){
				console.log("'",prop,"'->'",timerHandleMap[prop],"'", );
			}
			console.log("]");
			*/
			
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
			/*
			console.log("contents before removal are: [");
			for(var prop in timerHandleMap){
				console.log("'",prop,"'->'",timerHandleMap[prop],"'", );
			}
			console.log("]");
			*/
			if(timerHandleMap[plotdiv.id] != null){
				console.log("clearing interval for ",plotdiv.id);
				clearInterval(timerHandleMap[plotdiv.id]);
				timerHandleMap[plotdiv.id]=null;
			}
			/*
			console.log("contents after removal are: [");
			for(var prop in timerHandleMap){
				console.log("'",prop,"'->'",timerHandleMap[prop],"'", );
			}
			console.log("]");
			*/
		});
		
	}
	
	// finally add period updates to the initially open trace
	//var handle = setInterval(function(){ check_for_new_data('last_trace') }, 30000);
	//timerHandleMap['last_trace'] = handle;
	
	/*
	console.log("contents on initialisation are: [");
	for(var prop in timerHandleMap){
		console.log("'",prop,"'->'",timerHandleMap[prop],"'", );
	}
	console.log("]");
	*/
});

