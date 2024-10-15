var last;
var updateinterval;
var output = document.getElementById("output");
var tableselect = document.getElementById("tableselect");
var data =[];
var select = document.querySelector('select');
var graphDiv = document.getElementById("graph"); 
var updating=false;

//update dropdown called on startup
updatedropdown();

//function for updating dropdown box with monitoring sources
function updatedropdown(){
	
	//var xhr = new XMLHttpRequest();
	
	//var url = "/cgi-bin/sqltable.cgi";
	
	//var user ="root";
	//var db="daq";
	
	var command="SELECT distinct(device) from monitoring"
	
	
	// Set the request method to POST
	//xhr.open("POST", url);
	
	// Set the request header to indicate that the request body contains form data
	//xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	
	
	//var dataString = "user=" + user + "&db=" + db + "&command=" + command;
	
	
	// Send the request
	//xhr.send(dataString);
	
	
	
	//xhr.onreadystatechange = function() {
	//if (this.readyState == 4 && this.status == 200) {
	
	gettable(command).then(function(result){
	
	output.innerHTML = result;
	var table = document.getElementById("table");
	
	for( var i=1; i < table.rows.length; i++){    
		tableselect.options.add(new Option( table.rows[i].innerText, table.rows[i].innerText));
	}
	
	tableselect.selectedIndex=-1;
	output.innerHTML = "";
	tableselect.dispatchEvent(new Event("change"));
	
	});
	
}

//generic funcion for returning SQL table
function gettable(command){
	
	return new Promise(function(resolve, reject){
	var xhr = new XMLHttpRequest();
	
	var url = "/cgi-bin/sqlquery.cgi";
	
	var user ="root";
	var db="daq";
	
	// Set the request method to POST
	xhr.open("POST", url);
	
	// Set the request header to indicate that the request body contains form data
	xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	
	var dataString = "user=" + user + "&db=" + db + "&command=" + command;
	
	// Send the request
	xhr.send(dataString);
	
	xhr.onreadystatechange = function() {
		
		if (this.readyState == 4 && this.status == 200) {
		resolve(xhr.responseText);
		}
	    //else reject(new Error('error loading'));
	}
	});
	
}

// actions to take when dropdown changes
select.addEventListener('change', function(){ 
	
	if(tableselect.selectedIndex==-1) return;
	makeplot();
	
	if(document.getElementById("autoUpdate").checked){
		
		let refreshrate = document.getElementById("refreshRate").value;
		if(refreshrate<1) refreshrate=1;
		updateinterval = setInterval(updateplot, refreshrate*1000);
	}
	
});

// action to take when auto-update is checked
document.getElementById("autoUpdate").addEventListener("change", (event) => {
	
	if(tableselect.selectedIndex==-1) return;
	
	if(event.currentTarget.checked){
		let refreshrate = document.getElementById("refreshRate").value;
		if(refreshrate<1) refreshrate=1;
		updateinterval = setInterval(updateplot, refreshrate*1000);
		// since this doesn't fire immediately, call it now
		updateplot();
	}
	else {
		clearInterval(updateinterval);
	}
	
});

// action to take when auto-update refresh rate is changed
document.getElementById("refreshRate").addEventListener("change", (event) => {
	
	if(tableselect.selectedIndex==-1) return;
	
	if(document.getElementById("autoUpdate").checked){
		let refreshrate = document.getElementById("refreshRate").value;
		if(refreshrate<1) refreshrate=1;
		updateinterval = setInterval(updateplot, refreshrate*1000);
		// since this doesn't fire immediately, call it now
		updateplot();
	}
	else {
		clearInterval(updateinterval);
	}
	
});

function makeplot(){ //function to generate plotly plot
	
	clearInterval(updateinterval);
	
	
	// Get the selected option
	if (select.options.length >0){
	var selectedOption = select.options[select.selectedIndex];
	
	// TODO add alternative limit based on time range rather than number of rows?
	let numrows = document.getElementById("historyLength").value;
	if(numrows <= 0) numrows = 200;
	var command = `select * from monitoring where device='${selectedOption.value}' order by time desc LIMIT ${numrows}`;
	
	gettable(command).then(function(result){
		
		output.innerHTML=result;
		var table = document.getElementById("table");
		table.style.display = "none";
		var xdata= new Map();
		var ydata= new Map();
		
		// SQL query returns time descending (most recent first, seems sensible as that's the most relevant data)
		// but to append new data on update calls, we want to be able to push (append to back), so data arrays
		// needs to be ordered with earliest data first. So parse the sql response from last to first
		//for( var i=1; i< table.rows.length; i++){
		for( var i=table.rows.length-1; i>0 ; i--){
			
			//let jsonstring = table.rows[i].cells[2].innerText;
			var jsondata = JSON.parse(table.rows[i].cells[2].innerText);
			let xval = table.rows[i].cells[0].innerText.slice(0,-3);
			
			for (let key in jsondata) {
				
				//if( i == 1 ){
				if(!xdata.has(key)){
					
					xdata.set(key,[xval]);
					ydata.set(key,[jsondata[key]]);
					
				} else {
					xdata.get(key).push(xval);
					ydata.get(key).push(jsondata[key]);
					
				}
			}
		}
		
		data = [];
		for(let [key, value] of xdata){
			
			data.push({
				name: selectedOption.value + ":" +key,
				//mode: 'lines',        // 'mode' aka 'type'
				mode: 'markers',
				//mode:'lines+markers', //  aka 'scatter'
				x: value,
				y: ydata.get(key)
			});
			
		}
		
		var layout = {
			title: 'Monitor Time series with range slider and selectors',          
			xaxis: {
				rangeselector: selectorOptions,
				//rangeslider: {}  -- this limits zooming to x-axis only
			},
			yaxis: {
				fixedrange: false,
				autorange: true,
				//rangemode: 'nonnegative',
			}
		};
		
		while(!document.getElementById("same").checked && graphDiv.data != undefined && graphDiv.data.length >0)
		{
		Plotly.deleteTraces(graphDiv, 0);
		//   Plotly.deleteTraces(graphDiv, [0]);
		}
		//Plotly.deleteTraces('graph', 0);
		Plotly.plot(graphDiv, data, layout);
		
	});
	}
};


//function to update plot
function updateplot(){
	
	if(updating) return;
	updating=true;
	console.log("checking for new data...");
	
	try {
		// Get the selected option
		if (select.options.length == 0) return;
		var selectedOption = select.options[select.selectedIndex];
		
		//var command = "select '*' from monitoring where source=\""+ selectedOption.value + "\" and time>to_timestamp(" + ((last.valueOf())/1000.0) + ");  ";
		
		last=data[0].x[data[0].x.length-1];
		//console.log(`timestamp of last retreived data: ${last}`);
		//last = data[0].x[0];
		
		let numrows = document.getElementById("historyLength").value;
		if(numrows <= 0) numrows = 200;
		
		//var command = `select * from monitoring where device='${selectedOption.value}' and time>'${last.valueOf()}' order by time desc LIMIT ${numrows};`;
		var command = `select * from monitoring where device='${selectedOption.value}' and time>'${last.valueOf()}' order by time desc LIMIT ${numrows};`;
		
		gettable(command).then(function(result){
			
			output.innerHTML=result;
			var table = document.getElementById("table");
			table.style.display = "none";
			var xdata= new Map();
			var ydata= new Map();
			
			//for( var i=1; i< table.rows.length; i++){
			for( var i=table.rows.length-1; i>0 ; i--){
				
				const xval = table.rows[i].cells[0].innerText.slice(0,-3);
				let jsonstring = table.rows[i].cells[2].innerText;
				var jsondata = JSON.parse(table.rows[i].cells[2].innerText);
				
				for (let key in jsondata) {
					
					//if( i == 1 ){
					if(!xdata.has(key)){
						
						xdata.set(key,[xval]);
						ydata.set(key,[jsondata[key]]);
						
					} else {
						
						xdata.get(key).push(xval);
						ydata.get(key).push(jsondata[key]);
						
					}
				}
			}
			
			
			for(let [key, value] of xdata){
				for( var i=0; i< data.length; i++){
					if(data[i].name == selectedOption.value + ":" +key){ 
						data[i].x=data[i].x.concat(value);
						data[i].y=data[i].y.concat(ydata.get(key));
						// since we only append data we need to truncate to numrows at most
						data[i].x = data[i].x.slice(-numrows);
						data[i].y = data[i].y.slice(-numrows);
					}
				}
			}
			
			var layout = {
				title: 'Monitor Time series with range slider and selectors',          
				xaxis: {
					rangeselector: selectorOptions,
					//rangeslider: {} - this limits zooming to x-axis only
				},
				yaxis: {
					fixedrange: false,
					autorange: true,
					//rangemode: 'nonnegative',
				}
			};
			
			/*
			while(!document.getElementById("same").checked && graphDiv.data != undefined && graphDiv.data.length >0){
				Plotly.deleteTraces(graphDiv, 0);
				  Plotly.deleteTraces(graphDiv, [0]);
			}
			*/
			Plotly.redraw(graphDiv,data, layout);
			//Plotly.plot(graphDiv, data, layout);
			updating=false;
		});
		
	} catch(error){
		// always reset this
		updating=false;
	}
	
};


//plot options definitions
// TODO tie these up with history length
var selectorOptions = {
	buttons: [ {
		step: 'hour',
		stepmode: 'backward',
		count: 1,
		label: '1hr'
	}, {
		step: 'hour',
		stepmode: 'backward',
		count: 3,
		label: '3hr'
	}, {
		step: 'hour',
		stepmode: 'backward',
		count: 6,
		label: '6hr'
	}, {
		step: 'hour',
		stepmode: 'backward',
		count: 12,
		label: '12hr'
	}, {
		step: 'day',
		stepmode: 'backward',
		count: 1,
		label: '1d'
	}, {
		step: 'day',
		stepmode: 'backward',
		count: 3,
		label: '3d'
	}, {
		step: 'week',
		stepmode: 'backward',
		count: 1,
		label: '1w'
	}, {
		step: 'week',
		stepmode: 'backward',
		count: 2,
		label: '2w'
	}, {
		step: 'month',
		stepmode: 'backward',
		count: 1,
		label: '1m'
	}, {
		step: 'month',
		stepmode: 'backward',
		count: 6,
		label: '6m'
	}, {
		step: 'year',
		stepmode: 'todate',
		count: 1,
		label: 'YTD'
	}, {
		step: 'year',
		stepmode: 'backward',
		count: 1,
		label: '1y'
	}, {
		step: 'all'
	}],
};
