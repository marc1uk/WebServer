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


//// a general asynchronous getter for fetching data from a url
//async function getDataFetchRequest(url, json_or_text="text"){
//	//console.log("get_pure_trace::getDataFetchRequest(",url,")");
//	try {
//		let response = await fetch(url);
//		let thetext = "";
//		if(json_or_text=="json"){
//			thetext = await response.text();
//		} else {
//			thetext = await response.json();
//		}
//		return thetext;
//	} catch (err) {
//		console.log("Failed to get data from "+url, err);
//		return null;
//	}
//}

//// compare last data change time with last draw time
//// it maintains a map of timestamps as members of the functor
//// so we can track the last update time of many traces
//function compareTimestamp(name, timestamp){
//	// make an entry if there isn't one (cover case of first draw)
//	if (!('lastupdatetime' in compareTimestamp)){
//		compareTimestamp.lastupdatetime = [];
//	}
//	
//	if(compareTimestamp.lastupdatetime[name] != timestamp){
//		// time for an update
//		compareTimestamp.lastupdatetime = timestamp;
//		return true;
//		
//	} else {
//		// don't bother updating the plot, no new data.
//		return false;
//	}
//}

//// a function for parsing a json data string into a Plotly trace
//async function parseTrace(theData, theName){
//	
//	// since we make this function async, but stringify is presumably not async(?) so requires real data
//	// (not a promise to data), we need to wait for the data to come in before we start parsing.
//	theData = await theData;
//	
//	// split data
//	let jsonstring = JSON.stringify(theData);
//	let dataarray = JSON.parse(jsonstring);
//	// apparently this can fail to parse "over-stringified" strings.
//	// but we previously had issues when we DIDN'T stringify the data.
//	// so we may need to parse it twice??? ffs....
//	if(typeof dataarray==='string') dataarray = JSON.parse(dataarray);
//	let xvals = dataarray['xvals'];
//	let yvals = dataarray['yvals'];
//	
//	let thistrace = {
//		x: xvals,
//		y: yvals,
//		name: theName
//	};
//	
//	if(dataarray['xerrs'] != null){ thistrace['error_x'] = dataarray['xerrs']; }
//	if(dataarray['yerrs'] != null){ thistrace['error_y'] = dataarray['yerrs']; }
//	
//	return thistrace;
//}

// define configuration options for how the plot should embed itself in the webpage
// setting responsive true means the plot will scale with resizing of the container div.
// this results in weird oscillating sizes when plots are put into an accordian, so disable it
//const config = {responsive: false}

// define plot layout
const layout2=  {
	autosize: true,
	xaxis: {
		autorange:  true,  // auto-range by default
		// note user interaction will set this to false, but we should re-set it to true on updates
		
		// setting uirevision='true' allows retaining zoom level between redraws / refreshes.
		uirevision: true,
		
		// set x axis type
		type: 'date',
		
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
		fixedrange: false,  // this is required to allow the y-axis to be zoomable when we have a rangeslider enabled.
		autorange: true,
		//rangemode: 'nonnegative',  // some parameter values may be negative...
		uirevision: true,
		title: {
			text: 'Value'  // FIXME somehow we should set the units...?
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

const layout3=  {
	autosize: true,
	xaxis: {
		autorange:  true,  // auto-range by default
		// note user interaction will set this to false, but we should re-set it to true on updates
		
		// setting uirevision='true' allows retaining zoom level between redraws / refreshes.
		uirevision: true,
		
		// to reset changes to the ui view (and restore auto-range), set layout.uirevision to
		// a different numeric value than before (e.g. call `layout.uirevision = Math.random();`)
	},
	yaxis: {
		autorange: true,
		//rangemode: 'nonnegative',  // some parameter values may be negative...
		uirevision: true,
		title: {
			text: 'Value'  // FIXME somehow we should set the units...?
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

// function that takes the name of a plot and pulls the data and updates it.
async function GetTraces(name){
	//console.log("Plotting new data for trace ",name);
	
	let histlengthdiv = document.getElementById("historyLength");
	let histlength = histlengthdiv.value;
	let debugdiv = document.getElementById("debugToggle");
	let debug = debugdiv.checked;
	console.log("getting traces with debug: "+debug);
	
	let urls = undefined;
	
	if(name=="darktrace_pars"){
		// mean, width
		urls = new Map([["mean_LEDA", "/cgi-bin/marcus/get_measurement_values.cgi?a=dark_mean&b=275_A&c="+histlength+"&e="+debug],
		                ["width_LEDA","/cgi-bin/marcus/get_measurement_values.cgi?a=dark_range&b=275_A&c="+histlength+"&e="+debug],
		                ["mean_LEDB", "/cgi-bin/marcus/get_measurement_values.cgi?a=dark_mean&b=275_B&c="+histlength+"&e="+debug],
		                ["width_LEDB","/cgi-bin/marcus/get_measurement_values.cgi?a=dark_range&b=275_B&c="+histlength+"&e="+debug]]);
	}
	
	else if(name=="rawtrace_pars"){
		// min, max
		urls = new Map([["min_LEDA","/cgi-bin/marcus/get_measurement_values.cgi?a=raw_min&b=275_A&c="+histlength+"&e="+debug],
		                ["max_LEDA","/cgi-bin/marcus/get_measurement_values.cgi?a=raw_max&b=275_A&c="+histlength+"&e="+debug],
		                ["min_LEDB","/cgi-bin/marcus/get_measurement_values.cgi?a=raw_min&b=275_B&c="+histlength+"&e="+debug],
		                ["max_LEDB","/cgi-bin/marcus/get_measurement_values.cgi?a=raw_max&b=275_B&c="+histlength+"&e="+debug]]);
	}
	
	else if(name=="purefit_pars"){
		// tfitresultptr (pars, success, chi2)
		// MarcusAnalysis
//		urls = new Map([["chi2","/cgi-bin/marcus/get_measurement_values.cgi?a=pure_chi2&c="+histlength+"&e="+debug],
//		                ["stretch_x","/cgi-bin/marcus/get_measurement_values.cgi?a=pure_stretchx&c="+histlength+"&e="+debug],
//		                ["stretch_y","/cgi-bin/marcus/get_measurement_values.cgi?a=pure_stretchy&c="+histlength+"&e="+debug],
//		                ["shift_x","/cgi-bin/marcus/get_measurement_values.cgi?a=pure_shiftx&c="+histlength+"&e="+debug],
//		                ["shift_y","/cgi-bin/marcus/get_measurement_values.cgi?a=pure_shifty&c="+histlength+"&e="+debug],
//		                ["linear_bg","/cgi-bin/marcus/get_measurement_values.cgi?a=pure_linearcomp&c="+histlength+"&e="+debug],
//		                ["shoulder_width","/cgi-bin/marcus/get_measurement_values.cgi?a=pure_shoulderwid&c="+histlength+"&e="+debug],
//		                ["shoulder_amp","/cgi-bin/marcus/get_measurement_values.cgi?a=pure_shoulderamp&c="+histlength+"&e="+debug],
//		                ["shoulder_pos","/cgi-bin/marcus/get_measurement_values.cgi?a=pure_shoulderpos&c="+histlength+"&e="+debug]]);
		
		// MatthewAnalysisStrikesBack
		urls = new Map([["pure_scaling_A","/cgi-bin/marcus/get_measurement_values.cgi?a=pure_scaling&b=275_A&c="+histlength+"&e="+debug],
		                ["pure_translation_A","/cgi-bin/marcus/get_measurement_values.cgi?a=pure_translation&b=275_A&c="+histlength+"&e="+debug],
		                ["pure_stretch_A","/cgi-bin/marcus/get_measurement_values.cgi?a=pure_stretch&b=275_A&c="+histlength+"&e="+debug],
//		                ["gd_scaling_A","/cgi-bin/marcus/get_measurement_values.cgi?a=gd_scaling&b=275_A&c="+histlength+"&e="+debug],  // FIXME currently fixed to 0, fit sidebands only
		                ["second_order_background_A","/cgi-bin/marcus/get_measurement_values.cgi?a=second_order_background&b=275_A&c="+histlength+"&e="+debug],
		                ["first_order_background_A","/cgi-bin/marcus/get_measurement_values.cgi?a=first_order_background&b=275_A&c="+histlength+"&e="+debug],
//		                ["zeroth_order_background_A","/cgi-bin/marcus/get_measurement_values.cgi?a=zeroth_order_background&b=275_A&c="+histlength+"&e="+debug]  // FIXME currently fixed to 0, redundant with pure_scaling due to incorrect implementation

		                ["pure_scaling_B","/cgi-bin/marcus/get_measurement_values.cgi?a=pure_scaling&b=275_B&c="+histlength+"&e="+debug],
		                ["pure_translation_B","/cgi-bin/marcus/get_measurement_values.cgi?a=pure_translation&b=275_B&c="+histlength+"&e="+debug],
		                ["pure_stretch_B","/cgi-bin/marcus/get_measurement_values.cgi?a=pure_stretch&b=275_B&c="+histlength+"&e="+debug],
//		                ["gd_scaling_B","/cgi-bin/marcus/get_measurement_values.cgi?a=gd_scaling&b=275_B&c="+histlength+"&e="+debug],  // FIXME currently fixed to 0, fit sidebands only
		                ["second_order_background_B","/cgi-bin/marcus/get_measurement_values.cgi?a=second_order_background&b=275_B&c="+histlength+"&e="+debug],
		                ["first_order_background_B","/cgi-bin/marcus/get_measurement_values.cgi?a=first_order_background&b=275_B&c="+histlength+"&e="+debug]
//		                ["zeroth_order_background_B","/cgi-bin/marcus/get_measurement_values.cgi?a=zeroth_order_background&b=275_B&c="+histlength+"&e="+debug]  // FIXME currently fixed to 0, redundant with pure_scaling due to incorrect implementation

                       ]);
	}
	
	else if(name=="absfit_pars"){
		// tfitresultptr (pars, success, chi2)
		// MatthewAnalysisStrikesBack
		urls = new Map([["y_scaling_A","/cgi-bin/marcus/get_measurement_values.cgi?a=abs_fitpar0&b=275_A&c="+histlength+"&e="+debug],
		                ["x_trans_A","/cgi-bin/marcus/get_measurement_values.cgi?a=abs_fitpar1&b=275_A&c="+histlength+"&e="+debug],
		                ["bg_exp_mag_A","/cgi-bin/marcus/get_measurement_values.cgi?a=abs_fitpar2&b=275_A&c="+histlength+"&e="+debug],
		                ["bg_exp_dk_rate_A","/cgi-bin/marcus/get_measurement_values.cgi?a=abs_fitpar3&b=275_A&c="+histlength+"&e="+debug],
//		                ["redundant_A","/cgi-bin/marcus/get_measurement_values.cgi?a=abs_fitpar4&b=275_A&c="+histlength+"&e="+debug],
		                ["const_off_A","/cgi-bin/marcus/get_measurement_values.cgi?a=abs_fitpar5&b=275_A&c="+histlength+"&e="+debug],
		                ["y_scaling_B","/cgi-bin/marcus/get_measurement_values.cgi?a=abs_fitpar0&b=275_B&c="+histlength+"&e="+debug],
		                ["x_trans_B","/cgi-bin/marcus/get_measurement_values.cgi?a=abs_fitpar1&b=275_B&c="+histlength+"&e="+debug],
		                ["bg_exp_mag_B","/cgi-bin/marcus/get_measurement_values.cgi?a=abs_fitpar2&b=275_B&c="+histlength+"&e="+debug],
		                ["bg_exp_dk_rate_B","/cgi-bin/marcus/get_measurement_values.cgi?a=abs_fitpar3&b=275_B&c="+histlength+"&e="+debug],
//		                ["redundant_B","/cgi-bin/marcus/get_measurement_values.cgi?a=abs_fitpar4&b=275_B&c="+histlength+"&e="+debug],
		                ["const_off_B","/cgi-bin/marcus/get_measurement_values.cgi?a=abs_fitpar5&b=275_B&c="+histlength+"&e="+debug]]);
	}
	
	else if(name=="simplefit_pars"){
		// custom object (chi2, TODO fit pars?)
		urls = new Map([["peak1_chi2_LEDA","/cgi-bin/marcus/get_measurement_values.cgi?a=simple_peak1_chi2&b=275_A&c="+histlength+"&e="+debug],
		                ["peak2_chi2_LEDA","/cgi-bin/marcus/get_measurement_values.cgi?a=simple_peak2_chi2&b=275_A&c="+histlength+"&e="+debug],
		                ["peak1_chi2_LEDB","/cgi-bin/marcus/get_measurement_values.cgi?a=simple_peak1_chi2&b=275_B&c="+histlength+"&e="+debug],
		                ["peak2_chi2_LEDB","/cgi-bin/marcus/get_measurement_values.cgi?a=simple_peak2_chi2&b=275_B&c="+histlength+"&e="+debug]]);
	}
	
	else if(name=="complexfit_pars"){
		// custom object (chi2, TODO fit pars?)
		urls = new Map([["chi2_LEDA","/cgi-bin/marcus/get_measurement_values.cgi?a=complex_chi2&b=275_A&c="+histlength+"&e="+debug],
		                ["chi2_LEDB","/cgi-bin/marcus/get_measurement_values.cgi?a=complex_chi2&b=275_B&c="+histlength+"&e="+debug]
		                ]);
	}
	
	else if(name=="peak1_height"){
		urls = new Map([["rawfit_LEDA","/cgi-bin/marcus/get_measurement_values.cgi?a=raw_peakheight1&b=275_A&c="+histlength+"&e="+debug],
		                ["simplefit_LEDA","/cgi-bin/marcus/get_measurement_values.cgi?a=simple_peakheight1&b=275_A&c="+histlength+"&e="+debug],
		                ["complexfit_LEDA","/cgi-bin/marcus/get_measurement_values.cgi?a=complex_peakheight1&b=275_A&c="+histlength+"&e="+debug],
		                ["rawfit_LEDB","/cgi-bin/marcus/get_measurement_values.cgi?a=raw_peakheight1&b=275_B&c="+histlength+"&e="+debug],
		                ["simplefit_LEDB","/cgi-bin/marcus/get_measurement_values.cgi?a=simple_peakheight1&b=275_B&c="+histlength+"&e="+debug],
		                ["complexfit_LEDB","/cgi-bin/marcus/get_measurement_values.cgi?a=complex_peakheight1&b=275_B&c="+histlength+"&e="+debug]]);
	}
	
	else if(name=="peak2_height"){
		urls = new Map([["rawfit_LEDA","/cgi-bin/marcus/get_measurement_values.cgi?a=raw_peakheight2&b=275_A&c="+histlength+"&e="+debug],
		                ["simplefit_LEDA","/cgi-bin/marcus/get_measurement_values.cgi?a=simple_peakheight2&b=275_A&c="+histlength+"&e="+debug],
		                ["complexfit_LEDA","/cgi-bin/marcus/get_measurement_values.cgi?a=complex_peakheight2&b=275_A&c="+histlength+"&e="+debug],
		                ["rawfit_LEDB","/cgi-bin/marcus/get_measurement_values.cgi?a=raw_peakheight2&b=275_B&c="+histlength+"&e="+debug],
		                ["simplefit_LEDB","/cgi-bin/marcus/get_measurement_values.cgi?a=simple_peakheight2&b=275_B&c="+histlength+"&e="+debug],
		                ["complexfit_LEDB","/cgi-bin/marcus/get_measurement_values.cgi?a=complex_peakheight2&b=275_B&c="+histlength+"&e="+debug]]);
	}
	
	else if(name=="peak_diff"){
		urls = new Map([["rawfit_LEDA","/cgi-bin/marcus/get_measurement_values.cgi?a=raw_peakheightdiff&b=275_A&c="+histlength+"&e="+debug],
		                ["simplefit_LEDA","/cgi-bin/marcus/get_measurement_values.cgi?a=simple_peakheightdiff&b=275_A&c="+histlength+"&e="+debug],
		                ["complexfit_LEDA","/cgi-bin/marcus/get_measurement_values.cgi?a=complex_peakheightdiff&b=275_A&c="+histlength+"&e="+debug],
		                ["rawfit_LEDB","/cgi-bin/marcus/get_measurement_values.cgi?a=raw_peakheightdiff&b=275_B&c="+histlength+"&e="+debug],
		                ["simplefit_LEDB","/cgi-bin/marcus/get_measurement_values.cgi?a=simple_peakheightdiff&b=275_B&c="+histlength+"&e="+debug],
		                ["complexfit_LEDB","/cgi-bin/marcus/get_measurement_values.cgi?a=complex_peakheightdiff&b=275_B&c="+histlength+"&e="+debug]]);
	}
	
	else if(name=="gdconcentration"){
		// custom object
		// MarcusAnalysis
//		urls = new Map([["rawfit_LEDA","/cgi-bin/marcus/get_measurement_values.cgi?a=raw_gdconc&b=275_A&c="+histlength+"&e="+debug],
//		                ["simple_fit_LEDA","/cgi-bin/marcus/get_measurement_values.cgi?a=simple_gdconc&b=275_A&c="+histlength+"&e="+debug],
//		                ["complex_fit_LEDA","/cgi-bin/marcus/get_measurement_values.cgi?a=complex_gdconc&b=275_A&c="+histlength+"&e="+debug],
//		                ["rawfit_LEDB","/cgi-bin/marcus/get_measurement_values.cgi?a=raw_gdconc&b=275_B&c="+histlength+"&e="+debug],
//		                ["simplefit_LEDB","/cgi-bin/marcus/get_measurement_values.cgi?a=simple_gdconc&b=275_B&c="+histlength+"&e="+debug],
//		                ["complexfit_LEDB","/cgi-bin/marcus/get_measurement_values.cgi?a=complex_gdconc&b=275_B&c="+histlength+"&e="+debug]]);
		// MatthewAnalysisStrikesBack
		urls = new Map([["LEDA","/cgi-bin/marcus/get_measurement_values.cgi?a=gdconc&b=275_A&c="+histlength+"&e="+debug],
		                ["LEDB","/cgi-bin/marcus/get_measurement_values.cgi?a=gdconc&b=275_B&c="+histlength+"&e="+debug]]);
	}
	
	else if(name=="valve_state"){
		// custom object
		urls = new Map([["invalve","/cgi-bin/marcus/get_measurement_values.cgi?a=invalve"],
		                ["outvalve","/cgi-bin/marcus/get_measurement_values.cgi?a=outvalve"]]);
	}
	
	else if(name=="pi_mem"){
		// custom object
		urls = new Map([["mem_free","/cgi-bin/marcus/get_measurement_values.cgi?a=mem&c="+histlength+"&e="+debug],
		                ["cpu_usage","/cgi-bin/marcus/get_measurement_values.cgi?a=cpu&c="+histlength+"&e="+debug],
		                ["disk_usage","/cgi-bin/marcus/get_measurement_values.cgi?a=hdd1&c="+histlength+"&e="+debug],
		                ["temperature","/cgi-bin/marcus/get_measurement_values.cgi?a=temp&c="+histlength+"&e="+debug]]);
	}
	
	else if(name=="valve_temps"){
		// custom object
		//urls = new Map([["valve1_temp","/cgi-bin/marcus/get_measurement_values.cgi?a=valve1_temp&c="+histlength+"&e="+debug],
		//                ["valve2_temp","/cgi-bin/marcus/get_measurement_values.cgi?a=valve2_temp&c="+histlength+"&e="+debug]]);
		urls = new Map([["valve_temp","/cgi-bin/marcus/get_measurement_values.cgi?a=valve_temp&c="+histlength+"&e="+debug]]);
	}
	
	else /*if(name=="metric")*/ {
		// 
		urls = new Map([["LEDA","/cgi-bin/marcus/get_measurement_values.cgi?a="+name+"&b=275_A&c="+histlength+"&e="+debug],
		                ["LEDB","/cgi-bin/marcus/get_measurement_values.cgi?a="+name+"&b=275_B&c="+histlength+"&e="+debug]]);
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
	//const [firstkey] = urls.keys();
	//const [firsturl] = urls.values();
	//console.log("url 0 is ",firsturl);
	
	return traces;
	
}

async function UpdateHisto(name){
	// dynamic binning on zoom is possible:
	// https://www.statworx.com/en/content-hub/blog/fixing-the-most-common-problem-with-plotly-histograms/
	// see also making clicking a single plot show only that trace, and adding spikelines here:
	// https://dylancastillo.co/4-ways-to-improve-your-plotly-graphs/
	
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
	
	// histograms need to have the property set in each trace
	for(let i = 0; i < traces.length; i++) {
		traces[i]['type'] = 'histogram';
		traces[i]['x'] = traces[i]['y'];
		delete traces[i]['y'];
		traces[i]['opacity'] = 0.5;
		traces[i]['xaxis'] = 'x';
		traces[i]['yaxis'] = 'y';
	}
	
	
	// for plots with 2 traces, put them on different x axes
	if(traces.length==4){
		traces[1]['xaxis']='x2';
		traces[1]['yaxis']='y2';
		traces[3]['xaxis']='x2';
		traces[3]['yaxis']='y2';
	}
	
	// strip off the '_LEDA' suffix to get the underlying plot name
	let plname = traces[0]['name'].substr(0,traces[0]['name'].length-5);
	let plname2 = "";
	if(traces.length > 1) plname2 = traces[1]['name'].substr(0,traces[1]['name'].length-5);
	
	// XXX so it seems like this is acting as capturing a reference rather than making a copy,
	// which means if we use 'mylayout = layout2' or even 'mylayoutX = layout2' in both
	// UpdateTimeSeries and UpdateHisto, then even though 'mylayout' is a local variable,
	// the histograms inherit the time axis and scrubber, and if we delete them, they disappear
	// from the time plots too. :( OK, so just need to make two const layouts.
	let mylayout2 = layout3;
	
	// set x axis title
	if(traces.length>4) mylayout2.yaxis['title'] = { text: 'Occurrences' };
	else mylayout2.yaxis['title'] = { text: plname + ' Occurrences' };
	if(traces.length>4) mylayout2.xaxis['title'] = 'Value';
	else mylayout2.xaxis['title'] =  plname;
	mylayout2['barmode'] = "overlay";
	
	// add another y axis if 4 traces (2 variables, 2 LEDs)
	if(traces.length==4){
		mylayout2['yaxis2'] = { overlaying: 'y',
		                       side: 'right',
		                       title: plname2 + ' Occurrences'
		                      };
		mylayout2['xaxis2'] = { overlaying: 'x',
		                       side: 'top',
		                       title: plname2,
		                       position: 1,
		                       type: '-',
		                      };
	}
	
	// tell plotly the data has changed
	mylayout2.datarevision = Math.random();
	
	let divname = 'histo_' + name;
	
	// get the div element to insert plot into
	let HTMLDIV = document.getElementById(divname);
	
	// update the plot
	Plotly.react(HTMLDIV, traces, mylayout2, config);
	// trigger resizing to the containing div
	// doesn't seem to work??
	Plotly.relayout(HTMLDIV, {autosize: true});
}

async function UpdateTimeSeries(name){
	
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
	
	// set plot type for each trace to scatter
	for(let i = 0; i < traces.length; i++) {
		traces[i]['type'] = 'scatter';
		traces[i]['mode'] = 'markers+lines';
	}
	
	//console.log("UpdateTimeSeries for name ",name," had ",traces.length," traces");
	//console.log("UpdateTimeSeries for ",name," traces[0] is ",traces[0]);
	
	let startTime = traces[0]['x'][0];
	let endTime = traces[0]['x'][traces[0]['x'].length-2];
	//console.log("startTime is ",startTime);
	//console.log("endTime is ",endTime);
	
	// strip off the '_LEDA' suffix to get the underlying plot name
	let plname = traces[0]['name'].substr(0,traces[0]['name'].length-5);
	let plname2 = ""
	if(traces.length > 1) plname2 = traces[1]['name'].substr(0,traces[1]['name'].length-5);
	
//	// for plots with 2 traces, put them on different y axes
//	if(traces.length==4){
//		traces[1]['yaxis']='y2';
//		traces[3]['yaxis']='y2';
//	}
	
	let mylayout = layout2;
	
	// add a rangeslider to the correct range
	mylayout.xaxis['rangeslider'] = {range: [startTime, endTime] };
	
	// set x axis title
	if(traces.length>4) mylayout.yaxis['title'] = { text: 'Value' };
	else mylayout.yaxis['title'] = { text: plname };
	
//	// add another y axis if 4 traces (2 variables, 2 LEDs)
//	if(traces.length==4){
//		mylayout['yaxis2'] = { overlaying: 'y',
//		                       side: 'right',
//		                       title: plname2
//		                      };
//	}
	
	// tell plotly the data has changed
	mylayout.datarevision = Math.random();
	
	let divname = 'timeseries_' + name;
	
	// get the div element to insert plot into
	let HTMLDIV = document.getElementById(divname);
	
	// update the plot
	Plotly.react(HTMLDIV, traces, mylayout, config);
	
}

// retrieve new data and update the plot
function check_for_new_data2(name) {
	console.log("checking for new data for ",name);
	// we check a timestamp to see if the plot needs updating. But many plots have many traces,
	// so which timestamp do we check? Well, they more or less all get updated when a gdconc
	// measurement is made, with a whole slew of new db entries. So any one will do: raw_gdconc
	let timecheckname = "raw_gdconc";
	if(name=="valve_state") timecheckname = "valvestate_inlet";
	if(name=="pi_mem") timecheckname = "mem";
	let getTimeUrl = "/cgi-bin/marcus/get_last_trace_time.cgi?a="+timecheckname;
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
					console.log("new data for ",name);
					UpdateTimeSeries(name);
					UpdateHisto(name);
				}  else {
					// else no need to update plot
					console.log("no new data for ",name);
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
	const plots = document.getElementsByClassName("resultplot");
	
	// do an initial retrieval of all plot data FIXME sensible? or slow?
	//for(let i = 0; i < plots.length; i++) {
	//	check_for_new_data2(plots[i].id);
	//}
	
	// register events
	for(let i = 0; i < plots.length; i++) {
		
		let plotdiv = plots[i];
		let parentdiv = plotdiv.parentNode;
		//console.log("registering event for plot ",plotdiv.id," with parent ",parentdiv.id);
		
		let TSname = 'timeseries_' + plotdiv.id;
		let HSname = 'histo_' + plotdiv.id;
		console.log("update_histos registering plot ",TSname," and ",HSname);
		let TSdiv = document.getElementById(TSname);
		let HSdiv = document.getElementById(HSname);
		Plotly.newPlot(TSdiv, [], layout2, config);
		Plotly.newPlot(HSdiv, [], layout3, config);
		
		// add events for when a plot is shown from the accordian
		parentdiv.addEventListener("shown.bs.collapse", function(){
			//if(timerHandleMap[plotdiv.id] != null) return;
			console.log("registering ",plotdiv.id," for periodic updates");
			//var handle = setInterval(function(){check_for_new_data2(plotdiv.id) }, 30000);
			//timerHandleMap[plotdiv.id] = handle;
			
			// invoke it the first time
			check_for_new_data2(plotdiv.id);
//			let mylayout = layout2;
//			
//			mylayout.xaxis.autorange = true;
//			mylayout.yaxis.autorange = true;
//			
//			// tell plotly the ui has changed
//			mylayout.uirevision = Math.random();
			
			// resize plot to fit the div. We need to manually trigger a resize
			// on show, because plotly doesn't know the size of the containing
			// div until it is expanded. However, we can't do it here (immediately)
			// as the plot is generated asynchronously once data comes back,
			// and Plotly will fall over entirely if the plot doesn't yet exist.
			// so instead we trigger a resize on each data update (in plotData)
			console.log("updating layout for div ",plotdiv.id);
			Plotly.relayout(TSdiv, {autosize: true});
			Plotly.relayout(HSdiv, {autosize: true});
			
		});
		
		// add event to collapse to disable updates while the plot is not shown
		parentdiv.addEventListener("hidden.bs.collapse", function(){
			if(timerHandleMap[plotdiv.id] != null){
				console.log("clearing interval for ",plotdiv.id);
				clearInterval(timerHandleMap[plotdiv.id]);
				timerHandleMap[plotdiv.id]=null;
			} else {
				console.log("no timer handle for this plot");
			}
		});
		
	}
	
	// finally add period updates to the initially open traces
	//var handle = setInterval(function(){ check_for_new_data2('gdconcentration') }, 30000);
	//timerHandleMap['gdconcentration'] = handle;
});

