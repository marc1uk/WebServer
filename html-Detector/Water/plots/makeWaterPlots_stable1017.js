// Define the Plot constructor function (or use a class)
var updating = false;

function Plot(title, keys, graphDiv, selectedRange, ytitle, yrange, y2) {
   this.title = title;
   this.xtitle = "Time/ UTC";
   this.ytitle = ytitle;
   this.yrange = yrange;
   this.keys = keys;          // List of keys (strings)
   this.graphDiv = graphDiv;  // Graph div element from HTML
   this.selectedRange = selectedRange;
   this.data = [];            // Data object, starts as an empty array
   this.layout = [];            // Data object, starts as an empty array
   this.y2 = y2;
}

// Define the Device constructor function
function Device(name, plots) {
   this.name = name;    // Device name (string)
   this.plots = plots;  // List of plot objects
}

//setup each plot in turn 
const keysForPlot1 = ['PT1_Pressure', 'PT2_Pressure', 'FT1_Flow']; // Keys for Plot 1
const plot1Title = "Pressure/Flow";
const graphDiv1 = document.getElementById("graph_1");
const selectedRange1 = 60 * 60 * 1000;
const ytitle1 = "Pressure [bar]";
const yrange1 = [0,4];
const y2_plot1 = {
   keys: ['FT1_Flow'], // Example list of keys
   range: [3,4],            // Example range
   title: 'Flow [t/hr]'          // Example title
};
const plot1 = new Plot(plot1Title, keysForPlot1, graphDiv1, selectedRange1, ytitle1, yrange1, y2_plot1);

const keysForPlot2 = ['UT1_Depth', 'LT1_Level', 'PT6_Depth', 'PT5_Depth'];
const plot2Title = "Detector Level";
const graphDiv2 = document.getElementById("graph_2");
const selectedRange2 = 8 * 60 * 60 * 1000;
const ytitle2 = "Detector Level [m]";
const yrange2 = [3.2, 3.4];
const y2_plot2 = null;
const plot2 = new Plot(plot2Title, keysForPlot2, graphDiv2, selectedRange2, ytitle2, yrange2, y2_plot2);

// const keysForPlot3 = ['QC1_Resistivty_1', 'QC2_Resistivty_2', 'UT1_Cond_Scaled', 'sanlinity', 'TDS']; 
const keysForPlot3 = ['QC1_Conductivity', 'QC2_Conductivity', 'UT1_Conductivity'];
const plot3Title = "Water Quality";
const graphDiv3 = document.getElementById("graph_3");
const selectedRange3 = 12 * 60 * 60 * 1000;
const ytitle3 = "Water Quality [μS/cm]";
const yrange3 = [0,0.5];
const y2_plot3 = {
   keys: ['UT1_Conductivity'], // Example list of keys
   range: [3,8],            // Example range
   title: 'Water Quality [μS/cm]'          // Example title
};
const plot3 = new Plot(plot3Title, keysForPlot3, graphDiv3, selectedRange3, ytitle3, yrange3, y2_plot3);

const keysForPlot4 = ['UT1_Temperature'];
const plot4Title = "Water Temperature";
const graphDiv4 = document.getElementById("graph_4");
const selectedRange4 = 24 * 60 * 60 * 1000;
const ytitle4 = " Water temp [°C]";
const yrange4 = [20, 26];
const y2_plot4 = null;
const plot4 = new Plot(plot4Title, keysForPlot4, graphDiv4, selectedRange4, ytitle4, yrange4, y2_plot4);

// const keysForPlot5 = ['LeakDetector']; 
// const plot5Title = "Leak detectors";
// const graphDiv5 = document.getElementById("graph_5");
// const selectedRange5 = globalSelection;
// const plot5 = new Plot(plot5Title, keysForPlot5, graphDiv5, selectedRange5, ytitle1, yrange1);

const keysForPlot6 = ['PT3_Level', 'MixTank_Low', 'MixTank_High'];
const plot6Title = "Retention Tank";
const graphDiv6 = document.getElementById("graph_5");
const selectedRange6 = 60 * 60 * 1000;
const ytitle6 = "Retention Tank PT3 [m]";
const yrange6 = [0.3,1.5];
const y2_plot6 = {
   keys: ['MixTank_Low', 'MixTank_High'], // Example list of keys
   range: [-0.5, 1.5],            // Example range
   title: 'On/Off'          // Example title
};
const plot6 = new Plot(plot6Title, keysForPlot6, graphDiv6, selectedRange6, ytitle6, yrange6, y2_plot6);


// const device_1 = new Device("WaterPLC",[plot1,plot2,plot3,plot4,plot6])
const device_1 = new Device("Water_PLC", [plot1, plot2, plot3, plot4, plot6])

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

   if (time_option === null) {
      var command = "select * from monitoring where device='" + selectedDevice + "' order by time asc";
   } else {
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

   for (iDev = 0; iDev < devices.length; iDev++) {
      const device = devices[iDev];
      const [xdata, ydata] = await getTimeDataForDevice(device.name, time_option);

      // Function to create a plot for a given set of keys and the target graphDiv
      function createPlot(plot) {

         const data = plot.keys.map(key => {
            if (xdata.has(key)) {
               //remove the first n elements which used a different format
               const x_data_to_plot = xdata.get(key).slice(trimStartValues);
               const y_data_to_plot = ydata.get(key).slice(trimStartValues);
               //decide whether to use a second y axis 
               useY2Axis = false;

               if (plot.y2 !== null) {
                  if (plot.y2.keys.includes(key)) {
                     //this is a plot which has a second y axis and this is a key identified as being on that axis
                     useY2Axis = true;
                  }
               }
               return {
                  //the name must be the kkey for the update function to work
                  name: key,
                  mode: 'lines',
                  x: x_data_to_plot,
                  y: y_data_to_plot,
                  ...(useY2Axis ? { yaxis: 'y2' } : {})
               };
            }
            return null; // If key doesn't exist, return null
         }).filter(Boolean); // Filter out null values

         var lowerLimit = new Date(now.getTime() - (plot.selectedRange));  // Subtract 1 hour

         const layout = {
            title: {
               text: plot,
               font: { size: 16 },
               yanchor: 'top',
               xanchor: 'center',
               y: 0.95, // Adjust this value to move the title down
               x: 0.5, // Center the title horizontally
            },
            xaxis: {
               title: plot.xtitle,
               rangeselector: selectorOptions,
               range: [lowerLimit.toISOString(), now.toISOString()],  // Set range to the last hour
               // rangeslider: {
               //    visible: true, // Ensure the range slider is visible
               // },
               // Adjust the domain of the xaxis to change the overall space used
               // domain: [0, 0.9] // Adjust the domain to give more space to the plot
            },
            yaxis: {
               title: plot.ytitle,
               range: plot.yrange
            }
            // margin: {
            //    t: 70, // Top margin
            //    b: 20, // Bottom margin to give more space to the plot
            // },

         };
         if (plot.y2 !== null) {
            layout.yaxis2 = {
               title: plot.y2.title, // Use the title from y2_plot1
               overlaying: 'y', // Overlay on the primary y-axis
               side: 'right', // Position the y2 axis on the right side
               range: plot.y2.range // Set the range from y2_plot1
            };
         }
         Plotly.purge(plot.graphDiv); // Clear any existing plot
         Plotly.newPlot(plot.graphDiv, data, layout); // Plot the data

         return [data, layout];
      }

      //make a plot for each plot in the device
      for (iPlot = 0; iPlot < device.plots.length; iPlot++) {
         const plot = device.plots[iPlot];
         [plot.data, plot.layout] = createPlot(plot);
      }
   }
}


async function updateplot() { //fucntion to update plot

   if (updating) return;
   updating = true;

   var now = new Date();  // Get current time

   for (iDev = 0; iDev < devices.length; iDev++) {
      const device = devices[iDev];
      if (device.plots.length === 0) {
         console.log("No plots for device " + device.deviceName);
         return false;
      }

      // Get the last time of the last entry in the data
      const plot_0_data = device.plots[0].data[0];
      // console.log("plot_0_data",plot_0_data)
      last = plot_0_data.x[plot_0_data.x.length - 1];
      time_option = last.valueOf();

      //get only the new data by looking for data that arrived after the last data
      // console.log("Getting updated info")
      const [xdata_new, ydata_new] = await getTimeDataForDevice(device.name, time_option);
      //this should return the new data in the format xdata_new - with different keys for each variable 
      //needs to be concatenated onto the old data and replotted    

      //declare the function to make plots again
      function redrawPlot(data, plot) {
         // console.log("Calling redrawplot")
         var lowerLimit = new Date(now.getTime() - plot.selectedRange);  // Subtract 1 hour

         for (let [key, value] of xdata_new) {
            for (var i = 0; i < data.length; i++) {
               if (data[i].name == key) {
                  //this data[i] is the same key as this xdata_new entry
                  data[i].x = data[i].x.concat(value);
                  data[i].y = data[i].y.concat(ydata_new.get(key));

               }
            }
         }

         plot.layout = {
            title: {
               text: plot.title,
               font: { size: 16 },
               yanchor: 'top',
               xanchor: 'center',
               y: 0.95, // Adjust this value to move the title down
               x: 0.5, // Center the title horizontally
            },
            xaxis: {
               title: plot.xtitle,
               rangeselector: selectorOptions,
               range: [lowerLimit.toISOString(), now.toISOString()]  // Set range to the last hour

               // rangeslider: {
               //    visible: true, // Ensure the range slider is visible
               // },
               // Adjust the domain of the xaxis to change the overall space used
               // domain: [0, 0.9] // Adjust the domain to give more space to the plot
            },
            yaxis: {
               title: plot.ytitle,
               range: plot.yrange
            }
         };
         if (plot.y2 !== null) {
            plot.layout.yaxis2 = {
               title: plot.y2.title, // Use the title from y2_plot1
               overlaying: 'y', // Overlay on the primary y-axis
               side: 'right', // Position the y2 axis on the right side
               range: plot.y2.range // Set the range from y2_plot1
            };
         }

         // Plotly.redraw(graphDiv, data, layout);
         // layout.datarevision = Math.random();

         //Plotly.plot(graphDiv, data, layout);
         //Plotly.redraw(graphDiv,data, layout); -- deprecated in ~2017? can't find it in the docs
         Plotly.update(plot.graphDiv, data, plot.layout);

         //Plotly.plot(graphDiv, data, layout);
      }

      // if(xdata_new.size!=0){
      for (iPlot = 0; iPlot < device.plots.length; iPlot++) {
         plot = device.plots[iPlot];
         if (iPlot === 0) {
            console.log("redraw with limit", plot.selectedRange);
         }
         redrawPlot(plot.data, plot);
      }
      // }
      updating = false;
   }

};

// Function to initialize event listeners on each plot
function setupPlotListeners() {
   devices.forEach((device) => {
      device.plots.forEach((plot, plotIndex) => {
         const plotDiv = plot.graphDiv;
         // Check if the plotDiv exists
         if (plotDiv) {
            plotDiv.on('plotly_relayout', function (eventData) {
               // Capture the selected range
               if (eventData['xaxis.range[0]'] !== undefined && eventData['xaxis.range[1]'] !== undefined) {
                  const selectedRange = [
                     eventData['xaxis.range[0]'],
                     eventData['xaxis.range[1]']
                  ];
                  console.log("eventData", eventData['xaxis.range[0]'], " ", eventData['xaxis.range[1]'])
                  console.log("type eventData", typeof (eventData['xaxis.range[0]']), " ", typeof (eventData['xaxis.range[1]']))
                  // Convert date strings to Date objects
                  const startDate = new Date(selectedRange[0] + "Z");
                  const endDate = new Date(selectedRange[1]);
                  console.log("Selected Range for, Plot " + plot.title + ":", startDate, " ", endDate);

                  // Calculate the difference in milliseconds and then convert to days (or any other unit)
                  const rangeDifference = (endDate - startDate); // Difference in days                       
                  // Set the range difference directly in the plot object
                  plot.selectedRange = rangeDifference;
                  console.log("Selected Range for, Plot " + plot.title + ":", selectedRange);
                  console.log("Range Difference for, Plot " + plot.title + ":", rangeDifference, 'mins');
               }
            });
         } else {
            console.warn(`Plot div not found for Device ${device.id}, Plot ${plotIndex + 1}.`);
         }
      });
   });
}

//define the buttons for the range selection in plotly
var selectorOptions = { //plot options definitions
   buttons: [{
      step: 'minute',
      stepmode: 'backward',
      count: 1,
      label: '1min'
   }, {
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
document.addEventListener("DOMContentLoaded", async function () {
   await makeplot();
   setupPlotListeners();
   updateinterval = setInterval(updateplot, 2000);
});

