// Define the Plot constructor function (or use a class)
var updating=false;

function Plot(title, keys, graphDiv) {
   this.title = title;
   this.keys = keys;          // List of keys (strings)
   this.graphDiv = graphDiv;  // Graph div element from HTML
   this.data = [];            // Data object, starts as an empty array
}

// Define the Device constructor function
function Device(name, plots) {
   this.name = name;    // Device name (string)
   this.plots = plots;  // List of plot objects
}

//setup each plot in turn 
const keysForPlot1 = ['PT1_Pump_Pressur', 'PT2_OutputPressS', 'FT1_Flowmeter_Sc']; // Keys for Plot 1
const plot1Title = "Pressure/Flow";
var graphDiv1 = document.getElementById("graph_1");
const plot1 = new Plot(plot1Title, keysForPlot1, graphDiv1);

const keysForPlot2 = ['UT_1Depth_Scaled', 'LT_1_Level_Scale', 'PT_6_Depth_Scale', 'PT_5_Depth_Scale']; 
const plot2Title = "Detector Level";
var graphDiv2 = document.getElementById("graph_2");
const plot2 = new Plot(plot2Title, keysForPlot2, graphDiv2);

// const keysForPlot3 = ['QC1_Resistivty_1', 'QC2_Resistivty_2', 'UT1_Cond_Scaled', 'sanlinity', 'TDS']; 
const keysForPlot3 = ['QC1_Resistivty_1', 'QC2_Resistivty_2', 'UT1_Cond_Scaled']; 
const plot3Title = "Water Quality";
var graphDiv3 = document.getElementById("graph_3");
const plot3 = new Plot(plot3Title, keysForPlot3, graphDiv3);

const keysForPlot4 = ['UT_1_Temp']; 
const plot4Title = "Water Temperature";
var graphDiv4 = document.getElementById("graph_4");
const plot4 = new Plot(plot4Title, keysForPlot4, graphDiv4);

// const keysForPlot5 = ['LeakDetector']; 
// const plot5Title = "Leak detectors";
// var graphDiv5 = document.getElementById("graph_5");
// const plot5 = new Plot(plot5Title, keysForPlot5, graphDiv5);

const keysForPlot6 = ['PT_3_Level_Scale','Mix_Tank_Hi_Leve','Tank_In_DIGITAL_']; 
const plot6Title = "Retention Tank";
var graphDiv6 = document.getElementById("graph_5");
const plot6 = new Plot(plot6Title, keysForPlot6, graphDiv6);


// const device_1 = new Device("WaterPLC",[plot1,plot2,plot3,plot4,plot6])
const device_1 = new Device("Water_PLC",[plot1,plot2,plot3,plot4,plot6])

const devices = [device_1];

//the remainder of the functions will get the devices data from the database
//iterate through the plots to make each plot where each trace on the final plot is the 
//key defined in the object

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
   // console.log("Selected Device: ", selectedDevice); // Log the selected device

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
      // console.log("returning xdata ")
      return [xdata, ydata];
   } catch (error) {
      console.error("Error fetching data:", error);
      alert("An error occurred while fetching data. Please try again.");
      return [new Map(), new Map()]; // Return empty maps on error
   }
}

async function makeplot() {
   // console.log("Call make plot");
   // Clear the update interval
   // clearInterval(updateinterval);


   //remove the first 150 elements of the time series array which used a different format
   const trimStartValues = 0;

   //get the data from the database - returns a xdata and ydata
   //a map of keys (slow control variables)
   //x is then time for each of the variables and y is the value 
   var time_option = null;

   //set the range automatically
   var now = new Date();  // Get current time
   var oneHourAgo = new Date(now.getTime() - (60 * 60 * 1000));  // Subtract 1 hour


   for(iDev=0; iDev<devices.length; iDev++){
      const device = devices[iDev];
      const [xdata, ydata] = await getTimeDataForDevice(device.name,time_option);

      // Function to create a plot for a given set of keys and the target graphDiv
      function createPlot(keys, graphDiv, plottitle) {

         const data = keys.map(key => {
            if (xdata.has(key)) {
               console.log(key+" found")
               //remove the first n elements which used a different format
               const x_data_to_plot = xdata.get(key).slice(trimStartValues);
               const y_data_to_plot = ydata.get(key).slice(trimStartValues);
               if(key==="PT_3_LevelScale"){
                  console.log("x_data_to_plot",x_data_to_plot)
                  console.log("y_data_to_plot",y_data_to_plot)
               }
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
               range: [oneHourAgo, now],  // Set range to the last hour
               // rangeslider: {
               //    visible: true, // Ensure the range slider is visible
               // },
               // Adjust the domain of the xaxis to change the overall space used
               domain: [0, 0.9] // Adjust the domain to give more space to the plot
            },
            // margin: {
            //    t: 70, // Top margin
            //    b: 20, // Bottom margin to give more space to the plot
            // },

         };

         Plotly.purge(graphDiv); // Clear any existing plot
         Plotly.plot(graphDiv, data, layout); // Plot the data
         return data;
      }

      //make a plot for each plot in the device
      for(iPlot=0; iPlot<device.plots.length; iPlot++){
         const plot = device.plots[iPlot];
         console.log("Plot",iPlot,"key",plot.keys);
         plot.data = createPlot(plot.keys, plot.graphDiv, plot.title);
      }
   }
}


async function updateplot() { //fucntion to update plot

   if (updating) return;
   updating = true;
   
   var now = new Date();  // Get current time
   var oneHourAgo = new Date(now.getTime() - (60 * 60 * 1000));  // Subtract 1 hour


   for(iDev=0; iDev<devices.length; iDev++){
      const device = devices[iDev];
      if(device.plots.length === 0){
         console.log("No plots for device "+device.deviceName);
         return false;
      }
   
      // Get the last time of the last entry in the data
      const plot_0_data = device.plots[0].data[0];
      // console.log("plot_0_data",plot_0_data)
      last = plot_0_data.x[plot_0_data.x.length - 1];
      time_option = last.valueOf();

      //get only the new data by looking for data that arrived after the last data
      // console.log("Getting updated info")
      const [xdata_new, ydata_new] = await getTimeDataForDevice(device.name,time_option);
      // console.log("Got updated info")  
      //this should return the new data in the format xdata_new - with different keys for each variable 
      //needs to be concatenated onto the old data and replotted    

      //declare the function to make plots again
      function redrawPlot(data, graphDiv, plottitle){
         // console.log("Calling redrawplot")
         
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
               range: [oneHourAgo, now],  // Set range to the last hour

               // rangeslider: {
               //    visible: true, // Ensure the range slider is visible
               // },
               // Adjust the domain of the xaxis to change the overall space used
               domain: [0, 0.9] // Adjust the domain to give more space to the plot
            },
            // margin: {
            //    t: 70, // Top margin
            //    b: 20, // Bottom margin to give more space to the plot
            // },

         };
         // console.log("Call plotly redraw")
         Plotly.redraw(graphDiv, data, layout);
         //Plotly.plot(graphDiv, data, layout);
      }
      for(iPlot =0; iPlot<device.plots.length; iPlot++){
         plot = device.plots[iPlot];
         redrawPlot(plot.data, plot.graphDiv, plot.title);
      }
      updating = false;
   }

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

//this is the code which is executed when make waterplots is called
document.addEventListener("DOMContentLoaded", function() {
   makeplot();
   updateinterval=setInterval(updateplot, 2000);
});

