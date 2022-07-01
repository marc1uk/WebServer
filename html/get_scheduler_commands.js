async function GetDataFetchRequest(url, json_or_text="text"){
	try {
		let response = await fetch(url);
		if(json_or_text == "json"){
			let thejsonpromise = await response.json();
			return thejsonpromise;
		} else {
			let thetext = await response.text();
			return thetext;
		}
	} catch (err) {
		console.log("Failed to get data from ", url, err);
		return null;
	}
}

function ElementPosition(activeRow){
	// position of the top of the active row
	let elemPosY = activeRow.offsetTop;
	// scan up the parent tree of the active row
	// adding the y-offsets of all parents, to get the absolute
	// y-offset of the active row
	let theElement = activeRow.offsetParent;
	while(theElement != null){
		elemPosY += theElement.offsetTop;
		theElement = theElement.offsetParent;
	}
	// scroll it into view
	window.scrollTo(0,elemPosY);
}

// retrieve new data and update the table
function updateSchedulerCommands() {
	
	// keep track of the last active command with a member variable
	if(! ('lastActiveCommand' in updateSchedulerCommands)){
		updateSchedulerCommands.lastActiveCommand="";
	}
	
	// get table of scheduler commands.
	// TODO dunno if this is worth optimizing by just getting the current command index,
	// since the set of commands won't change over a run, and we should only need to change
	// which line is hightlighted. Need to figure out how to update the appropriate lines.
	// e.g. by giving each row an id, and modifying the innerHTML of it?
	// or by giving the active row a unique class, and setting the css style of it?
	try {
		// GetDataFetchRequest is defined in last_trace.js
		GetDataFetchRequest("http://192.168.2.53/cgi-bin/marcus/get_scheduler_commands.cgi").then(
			function(result){
				// get the div element to update
				let HTMLDIV = document.getElementById('scheduler_commands');
				//console.log("updating innerHTML with commands ",result);
				HTMLDIV.innerHTML = result;
				
				// scroll the command list if necessary to ensure the currently
				// active command is in view.
				let scrollElement = document.getElementById('activeCommand');
				let activeCommand = scrollElement.innerHTML;
				//console.log("currently active command: ",activeCommand);
				// e.g. '<td>quit</td>'
				
				// only update position on change, to try to limit how disruptive
				// this is for the user
				if(updateSchedulerCommands.lastActiveCommand!=activeCommand){
					//scrollElement.scrollIntoView();   // scrolls whole page
					//ElementPosition(scrollElement);   // this too, but more manually...
					document.getElementById('scheduler_table').scrollTop = scrollElement.offsetTop-10;
					updateSchedulerCommands.lastActiveCommand = activeCommand;
				}
			},
			function(error){
				console.log("error from promise of new current command:", error);
			}
		);
	} catch(error){
		console.log("error geting new scheduler commands: ",error);
	}
	
}

// set a timer to update the data every second
var timerHandle = setInterval(updateSchedulerCommands, 2000);
// an initial trigger
updateSchedulerCommands();
