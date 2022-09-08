"use strict";

// define plot layout
const layout= {
	// auto-range by default - note user interaction will set this property to false,
	// so we should re-set it to true on re-draws
	xaxis: {
		autorange:  true,
		
		// setting uirevision='true' allows retaining zoom level between redraws / refreshes.
		uirevision: true
	},
	yaxis: {
		autorange: true,
		uirevision: true
	}
}

// define configuration options for how the plot should embed itself in the webpage
// setting responsive true means the plot will scale with resizing of the container div
const config = {responsive: true}

// a general asynchronous getter for fetching data from a url
// (used for invoking and getting the return from cgi scripts)
async function getDataFetchRequest(url, json_or_text="json"){
	try {
		let response = await fetch(url);
		let thetext = await response.text();
		return thetext;
	} catch (err) {
		return null;
	}
}

// a function for parsing a json data string into a Plotly trace
function parseTrace(theData, theName){
	
	// split data
	// why do we need to 'stringify' the data? no idea.
	let jsonstring = JSON.stringify(theData);
	let dataarray = JSON.parse(jsonstring);
	let wavelengths = dataarray['xvals'];
	let adccounts = dataarray['yvals'];
	let adcerrors = dataarray['yerrs'];
	
	let thistrace = {
		type: 'scatter',
		x: wavelengths,
		y: adccounts,
		/* error_y: {
			//type: 'data',     // optional? can also have 'constant' or 'percent', useful with 'value: 0.1' for e.g.
			array: adcerrors
		}, */
		//visible: "legendonly", hide it by default, but can be enabled by clicking it in the legend
		name: theName
	};
	
	return thistrace;
}

function checkReturnedTimeStamp(name, timestamp){
	// identify when there is new data to plot by comparing the given timestamp to the last one seen
	// we keep one timestamp per trace, identified by name
	
	// To retain a persistent variable between calls we can add a member property to this function
	if (!('lasttracetime' in checkReturnedTimeStamp)) {
		// define an associative array of trace names to timestamps
		checkReturnedTimeStamp.lasttracetime = [];
	}
	
	
	if(checkReturnedTimeStamp.lasttracetime[name] != timestamp){
		// this timestamp is not the same as the one we have (or we dont have one for this trace) we have new data
		console.log("new time ",result,", updating old time ",checkReturnedTimeStamp.lasttracetime);
		checkReturnedTimeStamp.lasttracetime = result;
		return Promise.resolve('new data');
		
	} else {
		console.log("new time ",result," has not changed since last update time ",checkReturnedTimeStamp.lasttracetime);
		// don't bother updating the plot, no new data.
		return Promise.reject('no new data');
		// or equivalently
		//throw new Error('no new data');
		// which can then be either handled with a rejection handler function registered
		// as the second argument of 'then', or as an exception handler registered with a '.catch(...)' after '.then(...)'
	}
	
}

// a general purpose promise rejection / error handler
function LogError(error){
	console.log("fetch failed with error: ",error);
	return false;
}


//==============//
// main routine 
//==============//

// retrieve new data and update the plot
function check_for_new_data() {
	
	/* These are the different plots to draw
	// Traces:
	 + last trace ("last_trace" = json: "yvals", "yerrs", "xvals") [W]
	 
	 + dark subtracted trace in abs region ("dark_subtracted_data_in" = json tgrapherrors) [W]
	 + dark subtracted trace outside abs region ("dark_subtracted_data_out" = json tgrapherrors) [W]
	 + dark subtracted pure trace ("dark_subtracted_pure" = json tgrapherrors) [W]
	 + pure fitted to data: ("pure_scaled" = json tgrapherrors) [W]
	 
	 + absorbance graph: ("absorbance_trace" = json tgrapherrors) [W]
	
	// Fit Parameters: evolution over time?
	 + dark trace params - ("darktrace_params" = json: "mean", "width") [D]
	 + raw trace params  - ("rawtrace_params" = json: "max", "min" [within abs region]) [D]
	 + pure fit pars ("pure_fit_pars" = json from [fitting pars, fitting errors]) [D]
	 + pure fitresultptr ("pure_fit_status" = json from fitresultptr) [D]
	 + LHS absorbance peak fit ("left_abspk_fit_pars" = json from [fitting pars, fitting errors]) [D]
	 + LHS absorbance peak fitresultptr ("left_abspk_fit_status" = json from fitresultptr) [D]
	 + RHS absorbance peak fit ("right_abspk_fit_pars" = json from [fitting pars, fitting errors]) [D]
	 + RHS absorbance peak fitresultptr ("right_abspk_fit_status" = json from fitresultptr) [D]
	 + gd concentration: ("gdconcentration" = json: "val", "err") [D]
	*/
	
	// Plot last trace:
	// ---------------
	// get the timestamp of when the last trace was most recently updated
	try {
		let timestamp = GetDataFetchRequest("http://192.168.2.54/cgi-bin/marcus/get_last_trace_time.cgi");
		let newdataavailable = checkReturnedTimeStamp('last_trace', timestamp);
		// register callbacks for when the timestamp promise returns
		newdataavailable.then(
			/*
			// first handler is for when promise succeeded; i.e. timestamp checker says we have new data.
			// note that handlers can only accept one argument which is the return value of the called function.
			UpdateIfNewData,
			// the second handler is an optional rejection handler
			DoThisIfNoNewData
			*/
			// we can also register anonymous inline functions as the handlers: note the difference in syntax!
			// when using named functions, arguments are passed implicitly: only here do we need to name them!
			function(result){
				// the first handler is for fulfilled (successfully resolved) promises
				// in this case we wrapped a promise around a normal function call that we know always succeeds,
				if(result == true){
					// newest timestamp suggests we have new data! let's plot it.
					console.log("timestamp promise said we had new data, let's fetch it");
					
					let dataUrl = "http://192.168.2.54/cgi-bin/marcus/get_latest_trace.cgi";
					// we can attach 'then' handlers straight onto a function call that returns a promise
					GetDataFetchRequest(dataUrl).then(
						// hanlder function once new data is returned
						function(result){
							let traces = ParseData(result);
							console.log("traces are ",traces);
							
							// user interaction will set autorange to false, so we need to reset it to true
							layout.xaxis.autorange = true;
							layout.yaxis.autorange = true;
							
							// not changing uirevision will ensure that user interactions are unchanged
							// uncommenting this line will instead result in resetting the plot axes
							// layout.uirevision = Math.random();
							
							// in a similar vein, when Plotly.react is called, Plotly will assume it the data
							// is unchanged unless layout.datarevision is set to some new value
							// (or the 
							layout.datarevision = Math.random();
							
							// get the div element to insert plot into
							let HTMLDIV = document.getElementById('last_trace');
							
							// get plotly to make/update the plot
							Plotly.react( HTMLDIV, traces, layout, config);
						},
						// handler function if the promise of new data rejected
						function(error){
							console.log("promise of new data was a lie ;_;");
						}
					);
				} else {
					console.log("timestampPromise said there was no new data");
				}
			}
			// if checkReturnedTimeStamp rejects there's no need to take any action
			// so skip registration of a rejection handler
		);
	} catch(error){
		console.log(error);
	}
	
	
}

// set a timer to update the data every second
var timerHandle = setInterval(check_for_new_data, 2000);
// note we can call clearInterval(timerHandle) to stop the updates.

// invoke the function to draw the plot immediately
check_for_new_data();
