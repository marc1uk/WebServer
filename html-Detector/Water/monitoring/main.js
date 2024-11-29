import {fetchWaterMonitoringJSON, mapDataToTraces} from '../js/fetchData.js';
import { makePlots, extendPlots } from '../js/plotUtils.js';
import { defaultPlotConfigs } from "../js/plotConfig.js";

let now = new Date();
const defaultQueryTime = 24 * 60 * 60 * 1000; // Set the default query time to 24 hrs
const defaultTimeOption = new Date(now.getTime() - defaultQueryTime).toISOString();

let plotConfigs = [ ...defaultPlotConfigs ];

console.log(defaultTimeOption);
console.log("Fetching Data...");
const data = await fetchWaterMonitoringJSON(defaultTimeOption);
console.log("Mapping Data...");
const [xData, yData] = await mapDataToTraces(data);
console.log("Making plots...");
await makePlots(xData, yData, plotConfigs);

setPlotListeners();

setInterval(() => {
    extendPlots(plotConfigs);
}, 2000);

function setPlotListeners() {
    plotConfigs.forEach((plotConfig, index) => {
        const plotDiv = plotConfig.graphDiv;
        // Check if the plotDiv exists
        if (plotDiv) {
            plotDiv.on('plotly_relayout', (eventData) => {
                // Check for reset axes
                if (eventData['xaxis.autorange'] !== undefined) {
                    console.log(`[RELAYOUT] Reset axes clicked for Plot "${plotConfig.layout.title.text}".`);
                    const defaultSelectedRange = { ...defaultPlotConfigs[index].selectedRange };
                    plotConfig.selectedRange = defaultSelectedRange;
                } else if (eventData['xaxis.range[0]'] !== undefined && eventData['xaxis.range[1]'] !== undefined) {
                    const selectedRange = [
                    eventData['xaxis.range[0]'],
                    eventData['xaxis.range[1]']
                    ];
                    console.log(`[RELAYOUT] selected range for, Plot ${plotConfig.layout.title.text}:`, selectedRange);
                    // Convert date strings to Date objects
                    const startDate = new Date(selectedRange[0].endsWith("Z") ? selectedRange[0] : selectedRange[0] + "Z");
                    const endDate = new Date(selectedRange[1]);
    
                    // Calculate the difference in milliseconds and then convert to days (or any other unit)
                    const rangeDifference = (endDate - startDate); // Difference in days                       
                    // Set the range difference directly in the plot object
                    plotConfig.selectedRange = rangeDifference;
                    console.log("[RELAYOUT] rangeDifference for, Plot " + plotConfig.layout.title.text + ":", rangeDifference);
                    console.log("[RELAYOUT] xaxis range:", plotConfig.layout.xaxis.range);
                }                
            })
        } else {
            console.warn(`Plot div not found for Plot ${index + 1}.`);
        }
    });
}
function setPlotListeners2() {
    defaultPlotConfigs.forEach((plotConfig, index) => {
        const plotDiv = plotConfig.graphDiv;

        // Check if the plotDiv exists
        if (plotDiv) {
            let streamingPaused = false; // Track streaming state

            // Listen for user-triggered x-axis range changes (Zoom/Pan)
            plotDiv.on('plotly_relayout', (eventData) => {
                // Check for reset axes or range selector button click
                if (eventData['xaxis.autorange'] !== undefined) {
                    console.log(`[RELAYOUT] Reset axes clicked for Plot "${plotConfig.layout.title.text}".`);
                    streamingPaused = false; // Resume streaming
                } else if (!('xaxis.range[0]' in eventData && 'xaxis.range[1]' in eventData)) {
                    console.log(`[RELAYOUT] Range selector button clicked for Plot "${plotConfig.layout.title.text}".`);
                    streamingPaused = false; // Resume streaming
                }

                // Check for user zoom or pan
                if ('xaxis.range[0]' in eventData && 'xaxis.range[1]' in eventData) {
                    const selectedRange = [
                        eventData['xaxis.range[0]'],
                        eventData['xaxis.range[1]']
                    ];

                    // Convert date strings to Date objects
                    const startDate = new Date(selectedRange[0] + "Z");
                    const endDate = new Date(selectedRange[1]);

                    // Calculate the range difference
                    const rangeDifference = endDate - startDate;

                    // Lock the selected range
                    plotConfig.selectedRange = rangeDifference;
                    streamingPaused = true; // Pause streaming
                    console.log(`[RELAYOUT] Locked Range for Plot "${plotConfig.layout.title.text}":`, rangeDifference);

                    // Update the layout to keep the selected range fixed
                    Plotly.relayout(plotDiv, {
                        'xaxis.range': selectedRange
                    });
                }
            });

            // Prevent streaming updates when paused
            plotDiv.on('plotly_relayouting', () => {
                if (streamingPaused && plotConfig.selectedRange) {
                    Plotly.relayout(plotDiv, {
                        'xaxis.range': plotConfig.selectedRange
                    });
                }
            });

            // Periodically extend the plot if streaming is not paused
            setInterval(() => {
                if (!streamingPaused) {
                    extendPlots([plotConfig]);
                }
            }, 2000);
        } else {
            console.warn(`Plot div not found for Plot ${index + 1}.`);
        }
    });
}
