// use strict mode variable assignment.
// strict mode explicitly prevents many things that should not be allowed
// see https://www.w3schools.com/js/js_strict.asp for a list
"use strict";
// in a similar vein; see https://stackoverflow.com/a/11444416 for let vs var
// tl;dr - always use 'let'

// the classic way to get data from another source in javascript is XMLHttpRequest
// https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
// https://stackoverflow.com/a/61566857
function GetDataXMLHttpRequest(url){
	
	// make an XMLHttpRequest instance
	const XHR = new XMLHttpRequest();
	
	// for compatiblity with ancient browsers one often sees
	/*
	if(window.XMLHttpRequest){
		// code for IE7+, Firefox, Chrome, Opera, Safari
		XHR=new XMLHttpRequest();
	}
	else {
		// code for IE6, IE5
		XHR=new ActiveXObject("Microsoft.XMLHTTP");
	}
	*/
	
	// as per the developer.mozilla.org page, this has several events
	// that it may trigger on submission, so configure listeners...
	
	// 1a. Define what happens on successful data submission
	// callback function
	function doOnLoad(event){
		alert( event.target.responseText );
	}
	// link it to XMLHttpRequest instance `load` event
	XHR.addEventListener( "load", doOnLoad(event) );
	
	// declare the variable for the return data
	let data;
	
	// 1b. for some reason rather than using the 'load' event, we often fire on 'ready state change'
	// we can use `addEventListener("readystatechange", fn)`, or set the listener with:
	XHR.onreadystatechange = function(){
		// readystate is changed to a bunch of values as the page loads,
		// but we're generally only interested in executing our code when the page is
		// fully loaded (state 4) and didn't encounter any errors (status 200-299)
		// https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
		if (XHR.readyState==4 && XHR.status==200){
			// ok, we got our data, which we can retrieve from the response
			data= XHR.responseText;
			
			// for some reason this sometimes returns the data, though not sure why.
			return xmlhttp.responseText;
		}
	}
	
	// 2. Define what happens in case of error
	// more often the action to take is inlined into
	// an anonymous lambda function
	XHR.addEventListener( "error", function( event ) {
		alert( 'Oops! Something went wrong.' );
	} );
	
	// 3. ... and so on for any other events ...
	
	// whether to perform the request synchronously or asynchronously
	// async is recommended
	let async = true;
	
	// type of the request  - "GET" or "POST"
	let requesttype = "GET";
	
	/*
	// we can add form data to a POST request by constructing a
	// FormData object from a <form> html element, for example.
	// (see https://developer.mozilla.org/en-US/docs/Learn/Forms/Sending_forms_through_JavaScript
	// for other methods)
	
	// get the http form
	const form = document.getElementById( "myForm" );
	// construct a FormData object from it
	const FD = new FormData( form );
	*/
	
	// 4. initialise the request
	XHR.open( requesttype, theUrl, async );
	
	// 5. finally submit the request
	//XHR.send( FD );
	XHR.send(null);
	
	// return the data, which hopefully has been populated by our onreadystatechange callback
	return data;
	
}

// the modern way to get data from another source in javascript is 'fetch'
// https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
// https://stackoverflow.com/a/38297729
// https://jakearchibald.com/2015/thats-so-fetch/
// https://www.w3schools.com/js/js_async.asp
// fetch is asynchronous, so it returns a promise that must be attached to an event
// define a function to get a promise of data when the resource has responded...
async function GetDataFetchRequest(url, json_or_text="text"){
	//console.log("last_trace::GetDataFetchRequest called with url ",url);
	try {
		let response = await fetch(url);
		if(json_or_text == "json"){
			let thejsonpromise = await response.json();
			//console.log("fetch got json ",thejsonpromise);
			return thejsonpromise;
		} else {
			let thetext = await response.text();
			//console.log("fetch got text ",thetext);
			return thetext;
		}
	} catch (err) {
		console.log("Failed to get data from "+url, err);
		return null;
	}
}

function ParseData(theData){
	
	// split data
	//console.log("theData is ",theData);
	// why do we need to 'stringify' the data? no idea.
	let jsonstring = JSON.stringify(theData);
	let dataarray = JSON.parse(jsonstring);
	let wavelengths = dataarray['xvals'];
	let adccounts = dataarray['yvals'];
	let adcerrors = dataarray['yerrs'];
	let wlerrs = dataarray['xerrs'];
	//console.log("wavelengths are: ",wavelengths);
	
	// form into Plotly traces
	let traces = [
		{
			type: 'scatter',
			x: wavelengths,
			y: adccounts,
			/*
			error_x: {
				//type: 'data', // default. Can also use 'constant' or 'percent', combined with 'value: 0.1'
				array: wlerrs
			},
			error_y: {
				type: 'data',
				array: adcerrors
			}, */
			//visible: "legendonly", hide it by default, but can be enabled by clicking it in the legend
			name: 'last trace'
		} // add more elements, this is an array...
	];
	
	return traces;
	
}

// define plot layout
// NOTE: CHANGES TO LAYOUT REQUIRE A FORCED FULL RELOAD (SHIFT+F5)
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

function checkReturnedTimeStamp(lastDataUpdate){
	console.log("checkReturnedTimeStamp called");
	// see if the timestamp of the last taken trace is different to the last one we showed,
	// and return a promise to the new data if there is some
	
	// To retain the last timestamp we showed, we can define a member property of this function
	// (since javascript functions are objects), which will be retained between calls
	if (!('lasttracetime' in checkReturnedTimeStamp)) {
		// lasstracetime is not yet a defined member property - we have not yet shown any data.
		// update the internal time variable, and proceed to draw
		console.log("checkReturnedTimeStamp got first timestamp: ",lastDataUpdate);
		checkReturnedTimeStamp.lasttracetime = lastDataUpdate;
		return true;
		
	} else if(checkReturnedTimeStamp.lasttracetime != lastDataUpdate){
		// we have an existing timestamp, but this one is different: we have new data
		console.log("new time ",lastDataUpdate,", updating old time ",checkReturnedTimeStamp.lasttracetime);
		checkReturnedTimeStamp.lasttracetime = lastDataUpdate;
		return true;
		
	} else {
		console.log("new time ",lastDataUpdate," has not changed since last update time ",checkReturnedTimeStamp.lasttracetime);
		// don't bother updating the plot, no new data.
		return false;
	}
	
}

function ProcessTimestampError(error){
	console.log("fetch for new timestamp failed to obtain time of last trace: ",error);
	return false;
}

// retrieve new data and update the plot
function check_for_new_data() {
	
	console.log("last_trace.js checking for new data");
	
	// check if the timestamp of the last trace has changed
	let timeUrl = "http://192.168.2.54/cgi-bin/marcus/get_last_trace_time.cgi";
	
	// make a fetch request (i.e. invoke cgi script) to obtain a promise to data.
	let timestampPromise = GetDataFetchRequest(timeUrl, 'text');
	
	// to retrieve the result of a promise we register a callback to it that
	// will be invoked when the data becomes available. We register callbacks with the 'then' method.
	// This accepts two functions: the first will be called when (if) the promise resolves successfully,
	// the second when (if) it rejects with an error. The latter is optional.
	// Once invoked these functions will be passed whatever the promise gave to the corresponding
	// 'resolve' and 'reject' calls https://www.w3schools.com/js/js_promise.asp
	let newDataPromise = timestampPromise.then(
		checkReturnedTimeStamp,
		ProcessTimestampError
	)
	// we may optionally also register a handler for catching thrown exceptions
	// i'm not clear when this is invoked: see
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/catch
	.catch(err => {
		console.log("handling promise of new timestamp threw exception: ",err);
	});
	
	// see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/then#return_value
	// for the return value of the 'then' method. Although both checkReturnedTimeStamp and ProcessTimestampError
	// return bools, the corresponding value is only be available once the timestamp promise resolves.
	// Since promise handling is asynchronous, the 'then' call above will resolve at some arbitrary time later -
	// so it only makes sense that it returns a Promise! In this case, 'newDataPromise' wraps the result 
	// of whatever we are then able to chain another asynchronous function to act on this result once 
	// it's available
	newDataPromise.then(
		// btw: we can also register anonymous inline functions as the handlers: note the difference in syntax!
		// when using named functions, arguments are passed implicitly: only here do we need to name them!
		function(result){
			//console.log("checkReturnedTimeStamp reported comparison result: ",result);
			// the first handler is for fulfilled (successfully resolved) promises: since we wrapped
			// a normal function call, it shouldn't reject, but we need to check what the timestamp
			// comparison said
			if(result == true){
				// newest timestamp suggests we have new data! let's plot it.
				//console.log("timestamp promise said we had new data, let's fetch it");
				
				let dataUrl = "http://192.168.2.54/cgi-bin/marcus/get_latest_trace.cgi";
				// we can attach 'then' handlers straight onto a function call that returns a promise
				GetDataFetchRequest(dataUrl, "json").then(
					// hanlder function once new data is returned
					function(result){
						let traces = ParseData(result);
						//console.log("traces are ",traces);
						
						// user interaction will set autorange to false, so we need to reset it to true
						// on updates
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
						console.log("promise of new data was a lie ;_; - error: ",error);
					}
				);
			} else {
				console.log("timestampPromise said there was no new data");
			}
		},
		function(error){
			console.log("newDataPromise error: ",error);
		}
	);  // we won't attach a rejection handler, since checkReturnedTimeStamp will not reject...
	    // ('then' handlers only reject if they throw an error, or return a rejected promise)
	
}

// set a timer to update the data every second
//var timerHandle = setInterval(check_for_new_data, 200000);
// note we can call clearInterval(timerHandle) to stop the updates.

//check_for_new_data();
