"use strict";

import { DrawRootPlotJSON, DrawRootPlotDB, DrawRootPlot } from "/includes/functions.js";

// we also need these for testing, since we're making the json on the fly
import { openFile, toJSON } from 'https://root.cern/js/latest/modules/main.mjs';

if (document.readyState !== 'loading'){
	console.log("page is ready, initing immediately");
        Init();
} else {
	console.log("page not reading, adding waiter");
        document.addEventListener("DOMContentLoaded", Init);
}

async function Init(){
	console.log("initing");
	
	// demo test of root plotting functionality
	//   DrawRootPlot(div, obj, width=700, height=400) - draw a jsroot plot from jsroot plot object
	//   DrawRootPlotJSON(div, root_json) - draw a jsroot plot from jsroot compatible JSON string
	//   DrawRootPlotDB(div, plotname, plotver=-1) - draw a jsroot plot from database
	const thediv = document.getElementById("jsroot_div");
	
	/*
	// grab a demo root file off the web.
	let file = await openFile("https://root.cern/js/files/hsimple.root");
	let obj = await file.readObject("hpx;1");
	
	// 1.  draw it directly, if you have a jsroot object
	DrawRootPlotJSON(thediv,json);
	
	// 2. get the corresponding JSON (no need here but strings are easier to move around)
	//let json = await toJSON(obj);
	DrawRootPlotJSON(thediv,json);
	
	*/
	
	// 3. plot directly from the database, if it's stored in there
	DrawRootPlotDB(thediv, 'tpolytest');
	
}
