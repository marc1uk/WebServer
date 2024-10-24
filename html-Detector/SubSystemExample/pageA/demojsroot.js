"use strict";

import { DrawRootPlotJSON } from "/includes/functions.js";

// we also need these for testing, since we're making the json on the fly
import { openFile, toJSON } from 'https://root.cern/js/latest/modules/main.mjs';

// demo test of root plotting functionality
//   DrawRootPlot(div, obj, width=700, height=400) - draw a jsroot plot from jsroot plot object
//   DrawRootPlotJSON(div, root_json) - draw a jsroot plot from jsroot compatible JSON string
//   DrawRootPlotDB(div, plotname, plotver=-1) - draw a jsroot plot from database

if (document.readyState !== 'loading'){
	console.log("page is ready, initing immediately");
        Init();
} else {
	console.log("page not reading, adding waiter");
        document.addEventListener("DOMContentLoaded", Init);
}

async function Init(){
	console.log("initing");
	// grab a demo root file off the web.
	let file = await openFile("https://root.cern/js/files/hsimple.root");
	let obj = await file.readObject("hpx;1");
	let json = await toJSON(obj);
	
	// plot it
	const thediv = document.getElementById("testroot");
	DrawRootPlotJSON(thediv,json);
}
