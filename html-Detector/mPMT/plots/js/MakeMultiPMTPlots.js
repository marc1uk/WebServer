

var updating = false;


var xDataFIFOs = new Map();
var yDataFIFOs = new Map();

const MEDIAN_FILTER_WINDOW_LENGTH = 3;

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

let plots = [
   {
      graphDiv: document.getElementById("graph_0"), // The div element for the first plot
      keys: ['brb_fpga_temp'], // List of keys related to the plot
      selectedRange: 60 * 60 * 1000,
      data: [], // Initially an empty array for data
      layout: {
         title: {
            text: "MPMT CPU Temperature",
            font: { size: 16 },
            yanchor: 'top',
            xanchor: 'center',
            y: 0.95, // Adjust this value to move the title down
            x: 0.5, // Center the title horizontally
         },
         xaxis: {
            title: "Time/ UTC",
            rangeselector: selectorOptions
         },
         yaxis: {
            title: "Temp [C]",
            range: [0, 100]
         }
      }
   },
   {
      graphDiv: document.getElementById("graph_1"), // The div element for the first plot
      keys: ['pmt0_hvvolval', 'pmt1_hvvolval', 'pmt2_hvvolval', 'pmt3_hvvolval', 'pmt4_hvvolval', 'pmt5_hvvolval', 'pmt6_hvvolval', 'pmt7_hvvolval',
         'pmt8_hvvolval', 'pmt9_hvvolval', 'pmt10_hvvolval', 'pmt11_hvvolval', 'pmt12_hvvolval', 'pmt13_hvvolval', 'pmt14_hvvolval',
         'pmt15_hvvolval', 'pmt16_hvvolval', 'pmt17_hvvolval', 'pmt18_hvvolval'], // List of keys related to the plot
      selectedRange: 60 * 60 * 1000,
      data: [], // Initially an empty array for data
      layout: {
         title: {
            text: "MPMT HV Voltage",
            font: { size: 16 },
            yanchor: 'top',
            xanchor: 'center',
            y: 0.95, // Adjust this value to move the title down
            x: 0.5, // Center the title horizontally
         },
         xaxis: {
            title: "Time/ UTC",
            rangeselector: selectorOptions
         },
         yaxis: {
            title: "Voltage [V]",
            range: [0, 1500]
         }
      }
   },
   {
      graphDiv: document.getElementById("graph_2"), // The div element for the first plot
      keys: ['pmt0_hvcurval', 'pmt1_hvcurval', 'pmt2_hvcurval', 'pmt3_hvcurval', 'pmt4_hvcurval', 'pmt5_hvcurval', 'pmt6_hvcurval', 'pmt7_hvcurval',
         'pmt8_hvcurval', 'pmt9_hvcurval', 'pmt10_hvcurval', 'pmt11_hvcurval', 'pmt12_hvcurval', 'pmt13_hvcurval', 'pmt14_hvcurval',
         'pmt15_hvcurval', 'pmt16_hvcurval', 'pmt17_hvcurval', 'pmt18_hvcurval'], // List of keys related to the plot
      selectedRange: 60 * 60 * 1000,
      data: [], // Initially an empty array for data
      layout: {
         title: {
            text: "MPMT HV Current",
            font: { size: 16 },
            yanchor: 'top',
            xanchor: 'center',
            y: 0.95, // Adjust this value to move the title down
            x: 0.5, // Center the title horizontally
         },
         xaxis: {
            title: "Time/ UTC",
            rangeselector: selectorOptions
         },
         yaxis: {
            title: "Current [uA]",
            range: [0, 20]
         }
      }
   }
];

var mPMTNumber = "";

//this is the code which is executed when make waterplots is called
document.addEventListener("DOMContentLoaded", async function () {

   let findMPMTButton = document.getElementById("findMPMTButton");
   findMPMTButton.addEventListener("click", async (event) => {

      let mPMTTextBox = document.getElementById("mPMTTextBox");
      mPMTNumber = mPMTTextBox.value;

      await makePlots("TPMT" + mPMTNumber);
      setupPlotListeners();
      setInterval(() => updatePlots("TPMT" + mPMTNumber), 2000);
   })
});

async function makePlots(deviceName) {

   var time_option = null;

   //set the range automatically
   var now = new Date();  // Get current time

   const [xdata, ydata] = await getTimeDataForDevice(deviceName, time_option);

   for (iPlot = 0; iPlot < plots.length; iPlot++) {
      createSinglePlot(plots[iPlot], xdata, ydata, now)
      document.getElementById("graph_" + iPlot).style.visibility = "visible";
   }
}

function createSinglePlot(plot, xdata, ydata, now) {
   //creates the data object in the plot

   plot.data = plot.keys.map(key => {
      if (xdata.has(key)) {

         // THE DATA HAS TO BE REVERSED TO CHANGE TIME ORDER FROM DESC -> ASC
         // AND FILTERED TO REMOVE BAD MPMT VALUES
         xDataFIFOs.set(key, xdata.get(key).reverse());
         yDataFIFOs.set(key, ydata.get(key).reverse());

         const x_data_to_plot = xdata.get(key);
         const y_data_to_plot = medianFilter(ydata.get(key), MEDIAN_FILTER_WINDOW_LENGTH);

         //decide whether to use a second y axis 
         const data_trace = {
            //the name must be the key for the update function to work
            name: key,
            mode: 'lines',
            x: x_data_to_plot,
            y: y_data_to_plot
         };

         //if this is a key we want to put on the y2 axis put this in the data 
         if ('y2keys' in plot) {
            if (plot.y2keys.includes(key)) {
               data_trace.yaxis = 'y2';
            }
         }
         return data_trace;
      }
      return null; // If key doesn't exist, return null
   }).filter(Boolean); // Filter out null values

   var lowerLimit = new Date(now.getTime() - (plot.selectedRange));  // Subtract 1 hour

   //add the range using the selected range 
   plot.layout.xaxis.range = [lowerLimit.toISOString(), now.toISOString()];

   Plotly.purge(plot.graphDiv); // Clear any existing plot
   Plotly.newPlot(plot.graphDiv, plot.data, plot.layout); // Plot the data

   return true;
}

// Function to initialize event listeners on each plot
function setupPlotListeners() {
   plots.forEach((plot, plotIndex) => {
      console.log(plot);
      const plotDiv = plot.graphDiv;
      // Check if the plotDiv exists
      if (plotDiv) {
         plotDiv.on('plotly_relayout', function (eventData) {
            // Capture the selected range
            console.log("onPlotLayout");
            if (eventData['xaxis.range[0]'] !== undefined && eventData['xaxis.range[1]'] !== undefined) {
               const selectedRange = [
                  eventData['xaxis.range[0]'],
                  eventData['xaxis.range[1]']
               ];
               // Convert date strings to Date objects
               const startDate = new Date(selectedRange[0] + "Z");
               const endDate = new Date(selectedRange[1]);

               // Calculate the difference in milliseconds and then convert to days (or any other unit)
               const rangeDifference = (endDate - startDate); // Difference in days                       
               // Set the range difference directly in the plot object
               plot.selectedRange = rangeDifference;
               console.log("Selected Range for, Plot " + plot.layout.title + ":", selectedRange);
            }
         });
      } else {
         console.warn(`Plot div not found for Plot ${plotIndex + 1}.`);
      }
   });
}

function updateSinglePlot(plot, xdata_new, ydata_new, now) {

   var lowerLimit = new Date(now.getTime() - plot.selectedRange);  // Subtract 1 hour

   //loop through new data and add into the plot if the key is the same
   for (let [key, value] of xdata_new) {
      for (var i = 0; i < plot.data.length; i++) {
         if (plot.data[i].name == key) {
            //this data[i] is the same key as this xdata_new entry
            //so add it
            let newData = ydata_new.get(key);

            xDataFIFOs.set(key, enqueueFIFOArrayElements(xDataFIFOs.get(key), value));
            yDataFIFOs.set(key, enqueueFIFOArrayElements(yDataFIFOs.get(key), newData));

            // MEDIAN FILTER FOR UPCOMING DATA (MPMT GENERATES SOME BAD READOUTS)
            // 1. concatenate new data to the NUM_OF_LAST_ELEMENTS_TO_FILTER last elements of yDataFIFOs   
            // 2. median filter to get rid of the wrong values 
            // 3. swap the NUM_OF_LAST_ELEMENTS_TO_FILTER last elements of plot.data.y to plot new filtered data
            const NUM_OF_LAST_ELEMENTS_TO_FILTER = 10;

            filteredNewData = medianFilter(yDataFIFOs.get(key).slice(-NUM_OF_LAST_ELEMENTS_TO_FILTER), MEDIAN_FILTER_WINDOW_LENGTH);

            const x_data_to_plot = xDataFIFOs.get(key);
            const y_data_to_plot = plot.data[i].y.slice(0, -NUM_OF_LAST_ELEMENTS_TO_FILTER).concat(filteredNewData);

            // console.log("length splice: ", y_data_to_plot.length)

            plot.data[i].x = x_data_to_plot;
            plot.data[i].y = y_data_to_plot;
         }
      }
   }

   //change the axis limits to reflect current time and previous choice
   plot.layout.xaxis.range = [lowerLimit.toISOString(), now.toISOString()];

   Plotly.update(plot.graphDiv, plot.data, plot.layout);
}

async function updatePlots(deviceName) { //fucntion to update plot

   if (updating) return;
   updating = true;

   var now = new Date();  // Get current time

   // Get the last time of the last entry in the data
   const plot_0_data = plots[1].data[0];

   last = plot_0_data.x[plot_0_data.x.length - 1];
   time_option = last.valueOf();

   //get only the new data by looking for data that arrived after the last data
   const [xdata_new, ydata_new] = await getTimeDataForDevice(deviceName, time_option);
   for (iPlot = 0; iPlot < plots.length; iPlot++) {
      updateSinglePlot(plots[iPlot], xdata_new, ydata_new, now);
   }
   updating = false;


};
