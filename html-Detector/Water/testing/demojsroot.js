
// we also need these for testing, since we're making the json on the fly
//import { openFile, toJSON } from 'https://root.cern/js/latest/modules/main.mjs';

// demo test of root plotting functionality
//   DrawRootPlot(div, obj, width=700, height=400) - draw a jsroot plot from jsroot plot object
//   DrawRootPlotJSON(div, root_json) - draw a jsroot plot from jsroot compatible JSON string
//   DrawRootPlotDB(div, plotname, plotver=-1) - draw a jsroot plot from database

//if (document.readyState !== 'loading'){
//	console.log("page is ready, initing immediately");
//        Init();
//} else {
//	console.log("page not reading, adding waiter");
//        document.addEventListener("DOMContentLoaded", Init);
//}

//start laurence adaptation
//generic funcion for returning SQL table
//container to store all the data with all of the keys 
var data_plot1 =[];
var data_plot2 =[];
var data_plot3 =[];
var data_plot4 =[];
var data_plot5 =[];
var updating=false;

//copied from Ben's code in monitoring.js this queries the SQL and returns the table
function gettable(command) { //generic funcion for returning SQL table

   return new Promise(function (resolve, reject) {
      var xhr = new XMLHttpRequest();
      var url = "/cgi-bin/sqlquery.cgi";
      var user = "root";
      var db = "daq";
      // Set the request method to POST
      xhr.open("POST", url);
      // Set the request header to indicate that the request body contains form data
      xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
      var dataString = "user=" + user + "&db=" + db + "&command=" + command;
      // Send the request
      xhr.send(dataString);
      xhr.onreadystatechange = function () {
         if (this.readyState == 4 && this.status == 200) {
            resolve(xhr.responseText);
         }
         //	    else reject(new Error('error loading'));
      }
   });
}

async function getTimeDataForDevice(deviceName, time_option) {
   const selectedDevice = deviceName; // Fixed device value
   console.log("Selected Device: ", selectedDevice); // Log the selected device

   if(time_option===null){
      var command = "select * from monitoring where device='" + selectedDevice + "' order by time asc";
   }else{
      //time option needs to be a string to specify only get data after the last available data
      //this command is used to update and append
      var command = "select * from monitoring where device='" + selectedDevice + "' and time>'" + time_option + "' order by time asc;  ";
   }

   // Call gettable command asynchronously
   try {
      const result = await gettable(command);

      var tempDiv = document.createElement("div");
      tempDiv.innerHTML = result;

      // Get the table from the temporary div
      var table = tempDiv.querySelector("#table");

      if (!table) {
         console.error("Table not found in result.");
         return [new Map(), new Map()];
      }

      var xdata = new Map();
      var ydata = new Map();

      for (var i = 1; i < table.rows.length; i++) {
         var jsondata = JSON.parse(table.rows[i].cells[2].innerText);

         for (let key in jsondata) {
            if (!xdata.has(key)) {
               xdata.set(key, [table.rows[i].cells[0].innerText.slice(0, -3)]);
               ydata.set(key, [jsondata[key]]);
            } else {
               xdata.get(key).push(table.rows[i].cells[0].innerText.slice(0, -3));
               ydata.get(key).push(jsondata[key]);
            }
         }
      }
      console.log("returning xdata ")
      return [xdata, ydata];
   } catch (error) {
      console.error("Error fetching data:", error);
      alert("An error occurred while fetching data. Please try again.");
      return [new Map(), new Map()]; // Return empty maps on error
   }
}



async function makeplot() {
   console.log("Call make plot");
   // Clear the update interval
   // clearInterval(updateinterval);

   // Define the same keys for each plot
   const keysForPlot1 = ['PT1_Pump_Pressur', 'PT2_OutputPressS', 'FT1_Flowmeter_Sc']; // Keys for Plot 1
   const keysForPlot2 = ['UT_1Depth_Scaled', 'LT_1_Level_Scale', 'PT_6_Depth_Scale', 'PT_5_Depth_Scale']; // Keys for Plot 2
   const keysForPlot3 = ['QC1_Resistivty_1', 'QC2_Resistivty_2', 'UT1_Cond_Scaled', 'sanlinity', 'TDS']; // Keys for Plot 3
   const keysForPlot4 = ['UT_1_Temp']; // Keys for Plot 3
   const keysForPlot5 = ['LeakDetector']; // Keys for Plot 3

   //define titles for each of the plots we want to make
   const plot1Title = "Pressure/Flow"
   const plot2Title = "Detector Level"
   const plot3Title = "Water Quality"
   const plot4Title = "Water Temperature"
   const plot5Title = "Leak detectors"

   //remove the first 150 elements of the time series array which used a different format
   const trimStartValues = 150;

   //get the data from the database - returns a xdata and ydata
   //a map of keys (slow control variables)
   //x is then time for each of the variables and y is the value 
   var time_option = null;
   const [xdata, ydata] = await getTimeDataForDevice("WaterPLC",time_option);
   //push the data into the all data object to keep track of all the data from the monitoring device
   //this copies what is done in the   
   // for(let [key, value] of xdata){
   //    console.log("xdata",value);
   //    all_data.push({
   //       name: "WaterPLC" + ":" +key,
   //       mode: 'lines',
   //       x: value,
   //       y: ydata.get(key)
   //    });
      
   // }

   // Static graph div variables - fromt the HTML
   var graphDiv1 = document.getElementById("graph_1"); // Static reference for Plot 1
   var graphDiv2 = document.getElementById("graph_2"); // Static reference for Plot 2
   var graphDiv3 = document.getElementById("graph_3"); // Static reference for Plot 3
   var graphDiv4 = document.getElementById("graph_4"); // Static reference for Plot 3
   var graphDiv5 = document.getElementById("graph_5"); // Static reference for Plot 3

   // Function to create a plot for a given set of keys and the target graphDiv
   function createPlot(keys, graphDiv, plottitle) {

      const data = keys.map(key => {
         if (xdata.has(key)) {
            console.log("key", key)
            //remove the first n elements which used a different format
            const x_data_to_plot = xdata.get(key).slice(trimStartValues);
            const y_data_to_plot = ydata.get(key).slice(trimStartValues);
            return {
               //the name must be the kkey for the update function to work
               name: key,
               mode: 'lines',
               x: x_data_to_plot,
               y: y_data_to_plot
            };
         }
         return null; // If key doesn't exist, return null
      }).filter(Boolean); // Filter out null values

      const layout = {
         title: {
            text: plottitle,
            font: { size: 16 },
            yanchor: 'top',
            xanchor: 'center',
            y: 0.95, // Adjust this value to move the title down
            x: 0.5, // Center the title horizontally
         },
         xaxis: {
            rangeselector: selectorOptions,
            rangeslider: {
               visible: true, // Ensure the range slider is visible
            },
            // Adjust the domain of the xaxis to change the overall space used
            domain: [0, 0.9], // Adjust the domain to give more space to the plot
         },
         margin: {
            t: 70, // Top margin
            b: 10, // Bottom margin to give more space to the plot
         },
      };

      Plotly.purge(graphDiv); // Clear any existing plot
      Plotly.plot(graphDiv, data, layout); // Plot the data
      return data;
   }

   // Create three plots with the same specified keys
   data_plot1 = createPlot(keysForPlot1, graphDiv1, plot1Title);
   data_plot2 = createPlot(keysForPlot2, graphDiv2, plot2Title);
   data_plot3 = createPlot(keysForPlot3, graphDiv3, plot3Title);
   data_plot4 = createPlot(keysForPlot4, graphDiv4, plot4Title);
   data_plot5 = createPlot(keysForPlot5, graphDiv5, plot5Title);

}


async function updateplot() { //fucntion to update plot

   if (updating) return;
   updating = true;

   // Static graph div variables - fromt the HTML
   var graphDiv1 = document.getElementById("graph_1"); // Static reference for Plot 1
   var graphDiv2 = document.getElementById("graph_2"); // Static reference for Plot 2
   var graphDiv3 = document.getElementById("graph_3"); // Static reference for Plot 3
   var graphDiv4 = document.getElementById("graph_4"); // Static reference for Plot 3
   var graphDiv5 = document.getElementById("graph_5"); // Static reference for Plot 3
   
   const plot1Title = "Pressure/Flow"
   const plot2Title = "Detector Level"
   const plot3Title = "Water Quality"
   const plot4Title = "Water Temperature"
   const plot5Title = "Leak detectors"
   
   // Get the selected option
   //data is the variable created by makeplot which contains all the subsystem data
   last = data_plot1[0].x[data_plot1[0].x.length - 1];
   time_option = last.valueOf();

   //get only the new data by looking for data that arrived after the last data
   console.log("Getting updated info")
   const [xdata_new, ydata_new] = await getTimeDataForDevice("WaterPLC",time_option);
   console.log("Got updated info")

   //this should return the new data in the format xdata_new - with different keys for each variable 
   //needs to be concatenated onto the old data and replotted 
   function redrawPlot(data, graphDiv, plottitle){
      console.log("Calling redrawplot")
      for (let [key, value] of xdata_new) {
         for (var i = 0; i < data.length; i++){
            if (data[i].name == key) {
               //this data[i] is the same key as this xdata_new entry
               data[i].x = data[i].x.concat(value);
               data[i].y = data[i].y.concat(ydata_new.get(key));
            }
         }
      }

      const layout = {
         title: {
            text: plottitle,
            font: { size: 16 },
            yanchor: 'top',
            xanchor: 'center',
            y: 0.95, // Adjust this value to move the title down
            x: 0.5, // Center the title horizontally
         },
         xaxis: {
            rangeselector: selectorOptions,
            rangeslider: {
               visible: true, // Ensure the range slider is visible
            },
            // Adjust the domain of the xaxis to change the overall space used
            domain: [0, 0.9], // Adjust the domain to give more space to the plot
         },
         margin: {
            t: 70, // Top margin
            b: 10, // Bottom margin to give more space to the plot
         },
      };
      console.log("Call plotly redraw")
      Plotly.redraw(graphDiv, data, layout);
      //Plotly.plot(graphDiv, data, layout);
      updating = false;
   }

   redrawPlot(data_plot1, graphDiv1, plot1Title);
   redrawPlot(data_plot2, graphDiv2, plot2Title);
   redrawPlot(data_plot3, graphDiv3, plot3Title);
   redrawPlot(data_plot4, graphDiv4, plot4Title);
   redrawPlot(data_plot5, graphDiv5, plot5Title);

};



//define the buttons for the range selection in plotly
var selectorOptions = { //plot options definitions
   buttons: [{
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
      count: 8,
      label: '8hr'
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
      step: 'all'
   }],
};

//do this when you open the page
document.addEventListener("DOMContentLoaded", function() {
   makeplot();
   updateinterval=setInterval(updateplot, 2000);
});

